import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { FestivalState } from '../../stores/festival-state';
import { ReservationFormComponent } from '../reservation-form-component/reservation-form-component';
import { AuthService } from '../../services/auth.service';
import type { ReservationDashboardRowDto } from '../../types/reservation-dashboard-row-dto';
import type { ReservationDeleteSummaryDto } from '../../types/reservation-delete-summary-dto';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-reservation-dashbord-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly _authService = inject(AuthService);
  readonly festivalState = inject(FestivalState);

  // Signal pour stocker la liste des réservations complètes
  readonly reservations = signal<ReservationDashboardRowDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deleteSummary = signal<ReservationDeleteSummaryDto | null>(null);
  readonly deleteSummaryLoading = signal(false);
  readonly deleteSummaryError = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly pendingDelete = signal<ReservationDashboardRowDto | null>(null);
  readonly canDeleteReservation = this._authService.isSuperOrganizer;
  readonly deletePrompt = computed(() => {
    const reservation = this.pendingDelete();
    return reservation ? `Supprimer la réservation de "${reservation.reservant_name}" ?` : '';
  });
  readonly deleteSummaryForPending = computed(() => {
    const summary = this.deleteSummary();
    const reservation = this.pendingDelete();
    if (!summary || !reservation || summary.reservation_id !== reservation.id) {
      return null;
    }
    return summary;
  });


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
        this.loadError.set(null);
        this.loading.set(false);
        console.log('Aucun festival sélectionné');
      }
    });
  }

  // Role : Charger les reservations pour un festival donne.
  // Préconditions : `festivalId` est valide.
  // Postconditions : La liste de reservations est mise a jour.
  private loadReservations(festivalId: number): void {
    this.loading.set(true);
    this.loadError.set(null);
    this._reservationService
      .getReservationsByFestival(festivalId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reservationsData) => {
          this.reservations.set(reservationsData);
          console.log('Réservations chargées:', reservationsData);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des réservations:', err);
          this.reservations.set([]);
          this.loadError.set(this.extractErrorMessage(err) || 'Erreur lors du chargement des réservations');
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
  
  readonly typeFilter = signal<'all' | ReservationDashboardRowDto['reservant_type']>('all'); // Filtre par type de reservant
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
    this.typeFilter.set(value as 'all' | ReservationDashboardRowDto['reservant_type']);
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

  // Role : Demander la suppression d'une reservation.
  // Préconditions : `reservation` est valide et l'utilisateur est autorise.
  // Postconditions : Ouvre la confirmation et charge le resume.
  requestDelete(reservation: ReservationDashboardRowDto): void {
    if (!reservation || !this.canDeleteReservation()) {
      return;
    }
    this.pendingDelete.set(reservation);
    this.deleteError.set(null);
    this.deleteSummaryError.set(null);
    this.deleteSummaryLoading.set(true);
    this.deleteSummary.set(null);
    this._reservationService
      .getReservationDeleteSummary(reservation.id)
      .pipe(
        catchError((error) => {
          this.deleteSummaryError.set(
            this.extractErrorMessage(error) || 'Erreur lors du chargement du résumé',
          );
          return of(null);
        }),
        finalize(() => this.deleteSummaryLoading.set(false)),
      )
      .subscribe((summary) => {
        if (summary) {
          this.deleteSummary.set(summary);
        }
      });
  }

  // Role : Annuler la suppression.
  // Préconditions : Une suppression est en attente.
  // Postconditions : Le modal est ferme et le resume reinitialise.
  cancelDelete(): void {
    this.pendingDelete.set(null);
    this.deleteSummary.set(null);
    this.deleteSummaryError.set(null);
    this.deleteSummaryLoading.set(false);
    this.deleteError.set(null);
  }

  // Role : Confirmer la suppression de la reservation.
  // Préconditions : Une reservation est selectionnee.
  // Postconditions : La reservation est supprimee et la liste rechargee.
  confirmDelete(): void {
    const reservation = this.pendingDelete();
    const currentFestival = this.festivalState.currentFestival();
    if (!reservation || !currentFestival || !this.canDeleteReservation()) {
      return;
    }
    this.isDeleting.set(true);
    this.deleteError.set(null);
    this._reservationService
      .deleteReservation(reservation.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.pendingDelete.set(null);
          this.deleteSummary.set(null);
          this.deleteError.set(null);
          this.loadReservations(currentFestival.id);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la réservation:', error);
          this.deleteError.set(
            this.extractErrorMessage(error) || 'Erreur lors de la suppression de la réservation',
          );
        },
      });
  }

  // Role : Normaliser un message d'erreur pour l'UI.
  // Preconditions : error est une erreur HttpClient.
  // Postconditions : Retourne un message utilisateur ou null.
  private extractErrorMessage(error: any): string | null {
    const apiError = error?.error;
    if (typeof apiError === 'string' && apiError.trim().length > 0) {
      return apiError;
    }
    if (apiError) {
      const details = apiError.details;
      if (typeof details === 'string' && details.trim().length > 0) {
        return apiError.error ? `${apiError.error} · ${details}` : details;
      }
      if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
        return apiError.error;
      }
    }
    if (typeof error?.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
    return null;
  }
}
