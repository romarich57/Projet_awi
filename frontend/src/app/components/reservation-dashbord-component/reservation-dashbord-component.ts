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
// Role : Afficher le tableau de bord des reservations pour un festival.
// Préconditions : Un festival courant est selectionne via FestivalState.
// Postconditions : Les reservations sont chargees et les actions utilisateur sont gerees.
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

  // Role : Charger les reservations pour un festival donne.
  // Préconditions : `festivalId` est valide.
  // Postconditions : La liste de reservations est mise a jour.
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

  // Role : Ouvrir le formulaire de creation de reservation.
  // Préconditions : Aucune.
  // Postconditions : `showReservationForm` passe a true.
  openReservationForm(): void {
    // Logique pour ouvrir le formulaire de réservation
    this.showReservationForm.set(true);
  }

  // Role : Naviguer vers la page de details d'une reservation.
  // Préconditions : `reservationId` est valide et un festival courant existe.
  // Postconditions : La navigation vers la page de details est declenchee.
  viewReservationDetails(reservationId: number): void {
    // Naviguer vers la page de détails de la réservation
    const currentFestival = this.festivalState.currentFestival();
    if (currentFestival) {
      this._router.navigate(['/reservation-details-page', reservationId], {
        queryParams: { festivalId: currentFestival.id }
      });
    }
  }
  
  readonly typeFilter = signal<'all' | string>('all'); // Filtre par type de reservant
  readonly sortKey = signal<'name-asc' | 'name-desc'>('name-asc'); // Tri par nom par defaut
  readonly searchQuery = signal(''); //recherche par nom

  readonly reservationsView = computed(() => {
    //On part de la liste complète
    let filtered = this.reservations();

    //Filtre par TYPE
    if (this.typeFilter() !== 'all') {
      filtered = filtered.filter((r) => r.reservant_type === this.typeFilter());
    }

    // Filtre par NOM (Recherche)
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter((r) => 
        r.reservant_name?.toLowerCase().includes(query)
      );
    }

    // 4. Tri
    return [...filtered].sort((a, b) => {
      // Protection contre les valeurs nulles
      const nameA = a.reservant_name || '';
      const nameB = b.reservant_name || '';

      if (this.sortKey() === 'name-desc') {
        return nameB.localeCompare(nameA);
      }
      return nameA.localeCompare(nameB);
    });
  });

  // Role : Appliquer le filtre de type de reservant.
  // Préconditions : `value` est un type valide ou 'all'.
  // Postconditions : `typeFilter` est mis a jour.
  setTypeFilter(value: string): void {
    this.typeFilter.set(value);
  }

  // Role : Appliquer le tri de la liste.
  // Préconditions : `value` est un tri valide.
  // Postconditions : `sortKey` est mis a jour.
  setSortKey(value: string): void {
    this.sortKey.set(value as 'name-asc' | 'name-desc');
  }

  // Role : Reagir a la creation d'une reservation.
  // Préconditions : Un festival courant existe.
  // Postconditions : La liste est rechargee et le formulaire est ferme.
  onReservationCreated(): void {
    // Recharger la liste des réservations
    const currentFestival = this.festivalState.currentFestival();
    if (currentFestival) {
      this.loadReservations(currentFestival.id);
    }
    // Fermer le formulaire
    this.showReservationForm.set(false);
  }

  // Role : Appliquer la requete de recherche par nom.
  // Préconditions : `value` est une chaine de caracteres.
  // Postconditions : `searchQuery` est mis a jour.
  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }
}
