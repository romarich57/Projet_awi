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
export class FestivalCardComponent {

  festival = input.required<FestivalDto>();

  select = output<number | null>();

  private readonly festivalStore = inject(FestivalState);

  // Vérifier si ce festival est actuellement sélectionné
  readonly selected = computed(() => {
    const currentFestival = this.festivalStore.currentFestival();
    return currentFestival?.id === this.festival().id;
  });

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

}
