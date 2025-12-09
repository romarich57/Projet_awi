import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { FestivalState } from '../../stores/festival-state';
import { ReservantDto } from '../../types/reservant-dto';
import { ReservationFormComponent } from '../reservation-form-component/reservation-form-component';

@Component({
  selector: 'app-reservation-dashbord-component',
  standalone: true,
  imports: [RouterLink, ReservationFormComponent],
  templateUrl: './reservation-dashbord-component.html',
  styleUrl: './reservation-dashbord-component.scss',
})
export class ReservationDashbordComponent {

  private readonly _reservationService = inject(ReservationService);
  private readonly _router = inject(Router);
  readonly festivalState = inject(FestivalState);

  // Signal pour stocker la liste des réservations complètes
  readonly reservations = signal<any[]>([]);


  constructor() {
    // Effect qui se déclenche quand le festival sélectionné change
    effect(() => {
      const currentFestival = this.festivalState.currentFestival();

      
      if (currentFestival) {
        console.log('Chargement des réservations pour le festival:', currentFestival.name);
        this.loadReservations(currentFestival.id);
      } else {
        // Aucun festival sélectionné, vider la liste
        this.reservations.set([]);
        console.log('Aucun festival sélectionné');
      }
    });
  }

  private loadReservations(festivalId: number): void {
    this._reservationService.getReservationsByFestival(festivalId).subscribe({
      next: (reservationsData) => {
        this.reservations.set(reservationsData);
        console.log('Réservations chargées:', reservationsData);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.reservations.set([]);
      }
    });
  }

  showReservationForm = signal(false);

  openReservationForm(): void {
    // Logique pour ouvrir le formulaire de réservation
    this.showReservationForm.set(true);
  }

  viewReservationDetails(reservationId: number): void {
    // Naviguer vers la page de détails de la réservation
    const currentFestival = this.festivalState.currentFestival();
    if (currentFestival) {
      this._router.navigate(['/reservation-details-page', reservationId], {
        queryParams: { festivalId: currentFestival.id }
      });
    }
  }
  
  readonly typeFilter = signal<'all' | string>('all');
  readonly sortKey = signal<'name-asc' | 'name-desc'>('name-asc');

  readonly reservationsView = computed(() => {
    const filtered =
      this.typeFilter() === 'all'
        ? this.reservations()
        : this.reservations().filter((r) => r.reservant_type === this.typeFilter());

    return [...filtered].sort((a, b) => {
      if (this.sortKey() === 'name-desc') {
        return b.reservant_name.localeCompare(a.reservant_name);
      }
      return a.reservant_name.localeCompare(b.reservant_name);
    });
  });

  setTypeFilter(value: string): void {
    this.typeFilter.set(value);
  }

  setSortKey(value: string): void {
    this.sortKey.set(value as 'name-asc' | 'name-desc');
  }


}
