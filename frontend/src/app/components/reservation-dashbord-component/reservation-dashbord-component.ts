import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { FestivalState } from '../../stores/festival-state';
import { ReservantDto } from '../../types/reservant-dto';
import { ReservantCardComponent } from '../reservant-card-component/reservant-card-component';
import { ReservationFormComponent } from '../reservation-form-component/reservation-form-component';

@Component({
  selector: 'app-reservation-dashbord-component',
  standalone: true,
  imports: [ReservantCardComponent, RouterLink, ReservationFormComponent],
  templateUrl: './reservation-dashbord-component.html',
  styleUrl: './reservation-dashbord-component.scss',
})
export class ReservationDashbordComponent {

  private readonly _reservationService = inject(ReservationService);
  readonly festivalState = inject(FestivalState);

  // Signal pour stocker la liste des réservants
  readonly reservants = signal<ReservantDto[]>([]);

  constructor() {
    // Effect qui se déclenche quand le festival sélectionné change
    effect(() => {
      const currentFestival = this.festivalState.currentFestival();
      
      if (currentFestival) {
        console.log('Chargement des réservants pour le festival:', currentFestival.name);
        this.loadReservants(currentFestival.id);
      } else {
        // Aucun festival sélectionné, vider la liste
        this.reservants.set([]);
        console.log('Aucun festival sélectionné');
      }
    });
  }

  private loadReservants(festivalId: number): void {
    this._reservationService.getReservantsByFestival(festivalId).subscribe({
      next: (reservantsData) => {
        this.reservants.set(reservantsData);
        console.log('Réservants chargés:', reservantsData);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservants:', err);
        this.reservants.set([]);
      }
    });
  }

  showReservationForm = signal(false);

  openReservationForm(): void {
    // Logique pour ouvrir le formulaire de réservation
    this.showReservationForm.set(true);
  }

}
