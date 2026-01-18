import { Component, ChangeDetectionStrategy, computed, inject, input, output } from '@angular/core';
import { FestivalDto } from "../../types/festival-dto";
import { DatePipe } from '@angular/common';
import { FestivalState } from '../../stores/festival-state';
@Component({
  selector: 'app-festival-card-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DatePipe],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.scss',
})
// Role : Afficher une carte de festival et gerer la selection utilisateur.
// Préconditions : Le parent fournit `festival`; le store de festival est disponible.
// Postconditions : L'etat de selection est calcule et les evenements de selection sont emis.
export class FestivalCardComponent {

  festival = input.required<FestivalDto>();
  canDelete = input(false);

  select = output<number | null>();
  deleteFestival = output<number>();

  private readonly festivalStore = inject(FestivalState);

  // Verifier si ce festival est actuellement selectionne
  readonly selected = computed(() => {
    const currentFestival = this.festivalStore.currentFestival();
    return currentFestival?.id === this.festival().id;
  });

  // Role : Basculer la selection du festival et notifier le parent.
  // Préconditions : `festival` est present; `festivalStore` est initialise.
  // Postconditions : Le festival est selectionne ou deselectionne et un id (ou null) est emis.
  onFestivalClick(): void {
    const festival = this.festival();
    if (this.selected()) {
      this.festivalStore.setCurrentFestival(null);
      this.select.emit(null);
      return;
    }
    this.festivalStore.setCurrentFestival(festival);
    this.select.emit(festival.id ?? null);
  }

  // Role : Demander la suppression d'un festival sans declencher la selection.
  // Préconditions : `festival` est present; l'evenement de clic est fourni.
  // Postconditions : Emission de l'id du festival a supprimer.
  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    const festivalId = this.festival().id;
    if (!festivalId) {
      return;
    }
    this.deleteFestival.emit(festivalId);
  }

}
