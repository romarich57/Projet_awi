import { Component, input } from '@angular/core';

@Component({
  selector: 'app-reservation-detail-component',
  imports: [],
  templateUrl: './reservation-detail-component.html',
  styleUrl: './reservation-detail-component.scss'
})
export class ReservationDetailComponent {
  reservationId = input<number | null>(null);
}
