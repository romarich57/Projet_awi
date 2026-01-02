import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { FestivalDto } from "../../types/festival-dto";
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-festival-card-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.scss',
})
export class FestivalCardComponent {
  festival = input.required<FestivalDto>();
  select = output<number>();

  getTotalTables(): number {
    const fest = this.festival();
    return (fest.stock_tables_standard || 0) + 
           (fest.stock_tables_grande || 0) + 
           (fest.stock_tables_mairie || 0);
  }

  onFestivalClick(): void {
    const festival = this.festival();
    if (festival.id !== undefined) {
      this.select.emit(festival.id);
    }
  }
}