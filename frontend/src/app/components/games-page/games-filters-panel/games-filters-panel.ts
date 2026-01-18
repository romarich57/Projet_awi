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
// Role : Afficher le panneau de filtres et options de colonnes pour la liste des jeux.
// Préconditions : Les filtres, options et listes de reference sont fournis par le parent.
// Postconditions : Les changements de filtres/colonnes sont emis.
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

  // Role : Mettre a jour un filtre et emettre la nouvelle valeur.
  // Préconditions : `partial` contient des champs valides.
  // Postconditions : `filtersChanged` est emis avec les filtres mis a jour.
  updateFilter(partial: Partial<GamesFilters>): void {
    const next = { ...this.localFilters(), ...partial };
    this.localFilters.set(next);
    this.filtersChanged.emit(next);
  }

  // Role : Soumettre explicitement les filtres courants.
  // Préconditions : Les filtres locaux sont definis.
  // Postconditions : `filtersChanged` est emis.
  submit(): void {
    this.filtersChanged.emit({ ...this.localFilters() });
  }

  // Role : Activer ou desactiver une colonne visible.
  // Préconditions : `key` est une cle valide de GamesVisibleColumns.
  // Postconditions : `visibleColumnsChanged` est emis avec les nouvelles valeurs.
  toggleColumn(key: keyof GamesVisibleColumns, checked: boolean): void {
    const next = { ...this.visibleColumns(), [key]: checked };
    this.visibleColumnsChanged.emit(next);
  }
}
