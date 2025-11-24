import { Component, inject, input, output } from '@angular/core';
import {FestivalDto} from "../../types/festival-dto";
import { DatePipe } from '@angular/common';
import { FestivalState } from '../../stores/festival-state';
@Component({
  selector: 'app-festival-card-component',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.scss',
})
export class FestivalCardComponent {

  festival = input.required<FestivalDto>();

  select = output<number>();

  festivaStore = inject(FestivalState);

  // Vérifier si ce festival est actuellement sélectionné
  isSelected(): boolean {
    const currentFestival = this.festivaStore.currentFestival();
    return currentFestival?.id === this.festival().id;
  }

  onFestivalClick(): void {
    const festival = this.festival();
    this.festivaStore.setCurrentFestival(festival);
    if (festival.id !== undefined){
      this.select.emit(festival.id);
    }
  }

}
