import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamesFiltersPanelComponent } from '../games-filters-panel/games-filters-panel';
import { GamesResultsListComponent } from '../games-results-list/games-results-list';
import { GamesStore } from '@app/stores/games-store';
import { FlashMessageService } from '@app/services/flash-message.service';
import type { GameDto } from '../../../types/game-dto';
import type { GamesFilters, GamesVisibleColumns } from '@app/types/games-page.types';

@Component({
  selector: 'app-games-page-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, GamesFiltersPanelComponent, GamesResultsListComponent],
  templateUrl: './games-page-container.html',
  styleUrl: './games-page-container.scss',
  providers: [GamesStore],
})
// Role : Orchestrer la page liste des jeux, filtres et actions.
// Préconditions : GamesStore est disponible et les routes sont configurees.
// Postconditions : Les jeux sont charges et les actions de navigation/suppression sont gerees.
export class GamesPageContainerComponent {
  private readonly router = inject(Router);
  readonly store = inject(GamesStore);
  private readonly flashMessage = inject(FlashMessageService);

  readonly games = this.store.games;
  readonly editors = this.store.editors;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly deleteError = this.store.deleteError;
  readonly filters = this.store.filters;
  readonly visibleColumns = this.store.visibleColumns;
  readonly columnOptions = this.store.columnOptions;
  readonly types = this.store.types;
  readonly flashMessageText = this.flashMessage.message;
  readonly flashMessageType = this.flashMessage.type;
  readonly pendingDelete = signal<GameDto | null>(null);
  readonly deletePrompt = computed(() => {
    const game = this.pendingDelete();
    return game ? `Supprimer "${game.title}" ?` : '';
  });

  constructor() {
    effect(() => {
      this.store.init();
    });
  }

  // Role : Naviguer vers la page de creation de jeu.
  // Préconditions : Le routeur est disponible.
  // Postconditions : La navigation vers la page de creation est declenchee.
  startCreate(): void {
    this.router.navigate(['/games', 'new']);
  }

  // Role : Mettre a jour les filtres de recherche.
  // Préconditions : `filters` est un objet valide.
  // Postconditions : Le store applique les filtres.
  onFiltersChanged(filters: GamesFilters): void {
    this.store.updateFilters(filters);
  }

  // Role : Mettre a jour les colonnes visibles.
  // Préconditions : `columns` est un objet valide.
  // Postconditions : Les preferences de colonnes sont enregistrees dans le store.
  onVisibleColumnsChanged(columns: GamesVisibleColumns): void {
    this.store.setVisibleColumns(columns);
  }

  // Role : Naviguer vers l'edition d'un jeu.
  // Préconditions : `game` contient un identifiant.
  // Postconditions : La navigation vers la page d'edition est declenchee.
  onEdit(game: GameDto): void {
    this.router.navigate(['/games', game.id, 'edit']);
  }

  // Role : Naviguer vers la page detail d'un jeu.
  // Préconditions : `game` contient un identifiant.
  // Postconditions : La navigation vers la page detail est declenchee.
  onView(game: GameDto): void {
    this.router.navigate(['/games', game.id]);
  }

  // Role : Ouvrir la confirmation de suppression pour un jeu.
  // Préconditions : `game` est defini.
  // Postconditions : Le jeu est stocke dans `pendingDelete`.
  onDelete(game: GameDto): void {
    this.pendingDelete.set(game);
  }

  // Role : Annuler la suppression en cours.
  // Préconditions : Une suppression est en attente.
  // Postconditions : `pendingDelete` est reinitialise.
  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  // Role : Confirmer la suppression du jeu selectionne.
  // Préconditions : `pendingDelete` contient un jeu.
  // Postconditions : Le jeu est supprime via le store.
  confirmDelete(): void {
    const game = this.pendingDelete();
    if (!game) return;
    this.pendingDelete.set(null);
    this.store.deleteGame(game);
  }
}
