import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GameApiService } from '../../services/game-api';
import { EditorApiService } from '../../services/editor-api';
import type { GameDto } from '../../types/game-dto';
import type { MechanismDto } from '../../types/mechanism-dto';
import type { EditorDto } from '../../types/editor-dto';

@Component({
  selector: 'app-games-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './games-page.html',
  styleUrl: './games-page.scss',
})
export class GamesPageComponent implements OnInit {
  private readonly gameApi = inject(GameApiService);
  private readonly editorApi = inject(EditorApiService);
  private readonly router = inject(Router);

  readonly games = signal<GameDto[]>([]);
  readonly mechanisms = signal<MechanismDto[]>([]);
  readonly editors = signal<EditorDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  filters = {
    title: '',
    type: '',
    editorId: '',
    minAge: '',
  };

  readonly columnOptions = [
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
  visibleColumns: Record<string, boolean> = {
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

  readonly types = computed(() =>
    Array.from(new Set(this.games().map((g) => g.type))).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    ),
  );

  ngOnInit(): void {
    this.loadMechanisms();
    this.loadEditors();
    this.loadGames();
  }

  loadGames(): void {
    this.loading.set(true);
    this.error.set(null);
    this.gameApi
      .list({
        title: this.filters.title.trim(),
        type: this.filters.type,
        editor_id: this.filters.editorId || null,
        min_age: this.filters.minAge || null,
      })
      .subscribe({
        next: (games) => this.games.set(games),
        error: (err) => this.error.set(err.message || 'Erreur lors du chargement des jeux'),
      })
      .add(() => this.loading.set(false));
  }

  loadMechanisms(): void {
    this.gameApi.listMechanisms().subscribe({
      next: (items) => this.mechanisms.set(items),
      error: (err) => console.error('Erreur lors du chargement des mécanismes', err),
    });
  }

  loadEditors(): void {
    this.editorApi.list().subscribe({
      next: (items) => this.editors.set(items),
      error: (err) => console.error('Erreur lors du chargement des éditeurs', err),
    });
  }

  startCreate(): void {
    this.router.navigate(['/games', 'new']);
  }

  startEdit(game: GameDto): void {
    this.router.navigate(['/games', game.id, 'edit']);
  }

  deleteGame(game: GameDto): void {
    if (!confirm(`Supprimer "${game.title}" ?`)) return;
    this.deleteError.set(null);
    this.gameApi.delete(game.id).subscribe({
      next: () => {
        this.games.set(this.games().filter((g) => g.id !== game.id));
      },
      error: (err) => {
        if (err.status === 409) {
          this.deleteError.set('Impossible de supprimer ce jeu car il est utilisé dans une réservation');
        } else {
          this.deleteError.set(err.message || 'Erreur lors de la suppression');
        }
      },
    });
  }

  isColumnVisible(key: keyof typeof this.visibleColumns): boolean {
    return !!this.visibleColumns[key];
  }

  playersLabel(game: GameDto): string {
    if (game.min_players || game.max_players) {
      const min = game.min_players ?? '?';
      const max = game.max_players ?? '?';
      return `${min} - ${max}`;
    }
    return '—';
  }

  ageLabel(game: GameDto): string {
    return `${game.min_age}+`;
  }

  durationLabel(game: GameDto): string {
    if (!this.isColumnVisible('duration')) return '';
    return game.duration_minutes ? `${game.duration_minutes} min` : '—';
  }

  descriptionSnippet(game: GameDto): string {
    if (!game.description) return '';
    const trimmed = game.description.trim();
    return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
  }
}
