import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { GameApiService } from '@app/services/game-api';
import { EditorApiService } from '@app/services/editor-api';
import { ReservationService } from '@app/services/reservation.service';
import { FestivalState } from '@app/stores/festival-state';
import type { GameDto } from '@app/types/game-dto';
import type { MechanismDto } from '@app/types/mechanism-dto';
import type { EditorDto } from '@app/types/editor-dto';
import type { GamesColumnOption, GamesFilters, GamesVisibleColumns } from '@app/types/games-page.types';

const DEFAULT_FILTERS: GamesFilters = {
  title: '',
  type: '',
  editorId: '',
  minAge: '',
};

const DEFAULT_VISIBLE_COLUMNS: GamesVisibleColumns = {
  type: true,
  editor: true,
  age: true,
  players: true,
  authors: true,
  mechanisms: true,
  theme: false,
  duration: false,
  prototype: true,
  description: false,
};

const COLUMN_OPTIONS: GamesColumnOption[] = [
  { key: 'type', label: 'Type' },
  { key: 'editor', label: 'Éditeur' },
  { key: 'age', label: 'Âge' },
  { key: 'players', label: 'Joueurs' },
  { key: 'authors', label: 'Auteurs' },
  { key: 'mechanisms', label: 'Mécanismes' },
  { key: 'theme', label: 'Thème' },
  { key: 'duration', label: 'Durée' },
  { key: 'prototype', label: 'Prototype' },
  { key: 'description', label: 'Description' },
];

@Injectable()
export class GamesStore {
  private readonly gameApi = inject(GameApiService);
  private readonly editorApi = inject(EditorApiService);
  private readonly reservationService = inject(ReservationService);
  private readonly festivalState = inject(FestivalState);

  private readonly _games = signal<GameDto[]>([]);
  private readonly _mechanisms = signal<MechanismDto[]>([]);
  private readonly _editors = signal<EditorDto[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _deleteError = signal<string | null>(null);
  private readonly _filters = signal<GamesFilters>({ ...DEFAULT_FILTERS });
  private readonly _visibleColumns = signal<GamesVisibleColumns>({ ...DEFAULT_VISIBLE_COLUMNS });
  private readonly _festivalEditorIds = signal<number[] | null>(null);

  readonly games = computed(() => {
    const editorIds = this._festivalEditorIds();
    const games = this._games();
    if (!editorIds) return games;
    if (editorIds.length === 0) return [];
    return games.filter((game) => game.editor_id !== null && editorIds.includes(game.editor_id));
  });
  readonly mechanisms = this._mechanisms.asReadonly();
  readonly editors = this._editors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly deleteError = this._deleteError.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly visibleColumns = this._visibleColumns.asReadonly();
  readonly columnOptions = COLUMN_OPTIONS;

  readonly types = computed(() =>
    Array.from(new Set(this.games().map((game) => game.type))).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    ),
  );

  constructor() {
    effect(() => {
      const festivalId = this.festivalState.currentFestivalId;
      if (festivalId == null) {
        this._festivalEditorIds.set(null);
        return;
      }
      this.loadFestivalEditors(festivalId);
    });
  }

  // Role : Initialiser le store en chargeant les filtres, les mecanismes, les editeurs et la liste des jeux.
  // Preconditions : Aucune.
  // Postconditions : Les listes de donnees sont chargees dans les signaux correspondants.
  init(): void {
    this.loadMechanisms();
    this.loadEditors();
    this.loadGames();
  }

  // Role : Exposer une methode de chargement globale pour le store.
  // Preconditions : Aucune.
  // Postconditions : Delegue a init pour charger les donnees.
  loadAll(): void {
    this.init();
  }

  // Role : Charger la liste des jeux selon les filtres courants.
  // Preconditions : Les filtres sont initialises dans le store.
  // Postconditions : Le signal _games est mis a jour et l'etat de chargement est ajuste.
  loadGames(): void {
    this._loading.set(true);
    this._error.set(null);
    const filters = this._filters();
    this.gameApi
      .list({
        title: filters.title.trim(),
        type: filters.type,
        editor_id: filters.editorId || null,
        min_age: filters.minAge || null,
      })
      .subscribe({
        next: (games) => this._games.set(games),
        error: (err) => this._error.set(err.message || 'Erreur lors du chargement des jeux'),
      })
      .add(() => this._loading.set(false));
  }

  // Role : Charger la liste des mecanismes disponibles.
  // Preconditions : GameApiService est disponible.
  // Postconditions : Le signal _mechanisms est mis a jour.
  loadMechanisms(): void {
    this.gameApi.listMechanisms().subscribe({
      next: (items) => this._mechanisms.set(items),
      error: (err: unknown) => console.error('Erreur lors du chargement des mécanismes', err),
    });
  }

  // Role : Charger la liste des editeurs disponibles.
  // Preconditions : EditorApiService est disponible.
  // Postconditions : Le signal _editors est mis a jour.
  loadEditors(): void {
    this.editorApi.list().subscribe({
      next: (items) => this._editors.set(items),
      error: (err: unknown) => console.error('Erreur lors du chargement des éditeurs', err),
    });
  }

  // Role : Mettre a jour les filtres et relancer le chargement des jeux.
  // Preconditions : Un objet de filtres valide est fourni.
  // Postconditions : Les filtres sont stockes et la liste des jeux est rechargee.
  updateFilters(filters: GamesFilters): void {
    this._filters.set({ ...filters });
    this.loadGames();
  }

  // Role : Mettre a jour les colonnes visibles du tableau.
  // Preconditions : Un objet de colonnes valides est fourni.
  // Postconditions : Le signal _visibleColumns est mis a jour.
  setVisibleColumns(columns: GamesVisibleColumns): void {
    this._visibleColumns.set({ ...columns });
  }

  // Role : Supprimer un jeu et mettre a jour la liste locale.
  // Preconditions : Le jeu cible existe et possede un id.
  // Postconditions : Le jeu est retire du signal _games ou une erreur est exposee.
  deleteGame(game: GameDto): void {
    this._deleteError.set(null);
    this.gameApi.delete(game.id).subscribe({
      next: () => {
        this.loadGames();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this._deleteError.set('Impossible de supprimer ce jeu car il est utilisé dans une réservation');
        } else {
          this._deleteError.set(err.message || 'Erreur lors de la suppression');
        }
      },
    });
  }

  // Role : Charger les ids d'editeurs associes au festival pour filtrer les jeux.
  // Preconditions : Un identifiant de festival valide est fourni.
  // Postconditions : Le signal _festivalEditorIds est mis a jour.
  private loadFestivalEditors(festivalId: number): void {
    this.reservationService.getReservantsByFestival(festivalId).subscribe({
      next: (reservants) => {
        const editorIds = Array.from(
          new Set(
            reservants
              .map((reservant) => reservant.editor_id)
              .filter((id): id is number => Number.isFinite(id)),
          ),
        );
        this._festivalEditorIds.set(editorIds);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des jeux du festival', err);
        this._festivalEditorIds.set([]);
      },
    });
  }
}
