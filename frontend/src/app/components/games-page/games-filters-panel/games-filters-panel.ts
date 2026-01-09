import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EditorDto } from '../../../types/editor-dto';
import type { GamesColumnOption, GamesFilters, GamesVisibleColumns } from '@app/types/games-page.types';

@Component({
  selector: 'app-games-filters-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './games-filters-panel.html',
  styleUrl: './games-filters-panel.scss',
})
export class GamesFiltersPanelComponent {
  readonly filters = input.required<GamesFilters>();
  readonly types = input<readonly string[]>([]);
  readonly editors = input<readonly EditorDto[]>([]);
  readonly visibleColumns = input.required<GamesVisibleColumns>();
  readonly columnOptions = input.required<GamesColumnOption[]>();

  readonly filtersChanged = output<GamesFilters>();
  readonly visibleColumnsChanged = output<GamesVisibleColumns>();

  readonly localFilters = signal<GamesFilters>({
    title: '',
    type: '',
    editorId: '',
    minAge: '',
  });

  constructor() {
    effect(() => {
      this.localFilters.set({ ...this.filters() });
    });
  }

  updateFilter(partial: Partial<GamesFilters>): void {
    const next = { ...this.localFilters(), ...partial };
    this.localFilters.set(next);
    this.filtersChanged.emit(next);
  }

  submit(): void {
    this.filtersChanged.emit({ ...this.localFilters() });
  }

  toggleColumn(key: keyof GamesVisibleColumns, checked: boolean): void {
    const next = { ...this.visibleColumns(), [key]: checked };
    this.visibleColumnsChanged.emit(next);
  }
}
