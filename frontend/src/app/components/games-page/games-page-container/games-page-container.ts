import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamesFiltersPanelComponent } from '../games-filters-panel/games-filters-panel';
import { GamesResultsListComponent } from '../games-results-list/games-results-list';
import { GamesStore } from '@app/stores/games-store';
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
export class GamesPageContainerComponent implements OnInit {
  private readonly router = inject(Router);
  readonly store = inject(GamesStore);

  readonly games = this.store.games;
  readonly editors = this.store.editors;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly deleteError = this.store.deleteError;
  readonly filters = this.store.filters;
  readonly visibleColumns = this.store.visibleColumns;
  readonly columnOptions = this.store.columnOptions;
  readonly types = this.store.types;
  readonly pendingDelete = signal<GameDto | null>(null);
  readonly deletePrompt = computed(() => {
    const game = this.pendingDelete();
    return game ? `Supprimer "${game.title}" ?` : '';
  });

  ngOnInit(): void {
    this.store.init();
  }

  startCreate(): void {
    this.router.navigate(['/games', 'new']);
  }

  onFiltersChanged(filters: GamesFilters): void {
    this.store.updateFilters(filters);
  }

  onVisibleColumnsChanged(columns: GamesVisibleColumns): void {
    this.store.setVisibleColumns(columns);
  }

  onEdit(game: GameDto): void {
    this.router.navigate(['/games', game.id, 'edit']);
  }

  onDelete(game: GameDto): void {
    this.pendingDelete.set(game);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const game = this.pendingDelete();
    if (!game) return;
    this.pendingDelete.set(null);
    this.store.deleteGame(game);
  }
}
