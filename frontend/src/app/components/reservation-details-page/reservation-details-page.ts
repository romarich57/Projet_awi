import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservationDetailComponent } from '../reservation-detail-component/reservation-detail-component';
import { WorkflowComponent } from '../workflow-component/workflow-component';
import { ZonePlanJeux } from '../zone-plan-jeux/zone-plan-jeux';
import { CommonModule } from '@angular/common';
import type { ReservationWithZones } from '@app/services/reservation.service';
import type { WorkflowDto } from '@app/types/workflow-dto';
import type { ReservantDto } from '@app/types/reservant-dto';

@Component({
  selector: 'app-reservation-details-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ReservationDetailComponent, WorkflowComponent, ZonePlanJeux],
  templateUrl: './reservation-details-page.html',
  styleUrl: './reservation-details-page.scss'
})
// Role : Afficher la page detail d'une reservation et ses sous-composants.
// Préconditions : L'URL contient les parametres `id` et potentiellement `festivalId`.
// Postconditions : Les signaux de page sont initialises et les donnees chargees sont stockees.
export class ReservationDetailsPage {
  readonly reservationIdParam = input<string | null>(null, { alias: 'id' });
  readonly festivalIdParam = input<string | null>(null, { alias: 'festivalId' });

  readonly reservationId = signal<number | null>(null);
  readonly festivalId = signal<number | null>(null);
  readonly reservationData = signal<ReservationWithZones | null>(null);
  readonly reservantType = signal<ReservantDto['type'] | null>(null);
  readonly presenteraJeux = signal<boolean | null>(null);
  readonly reservationRefreshToken = signal<number>(0);

  constructor() {
    effect(() => {
      const idParam = this.reservationIdParam();
      const festivalParam = this.festivalIdParam();
      const idValue = idParam ? Number(idParam) : null;
      const festivalValue = festivalParam ? Number(festivalParam) : null;

      this.reservationId.set(Number.isNaN(idValue) ? null : idValue);
      this.festivalId.set(Number.isNaN(festivalValue) ? null : festivalValue);
    });
  }

  // Role : Stocker la reservation chargee et mettre a jour les signaux derives.
  // Préconditions : `reservation` est chargee par le composant enfant.
  // Postconditions : Les donnees et le token de rafraichissement sont mis a jour.
  onReservationLoaded(reservation: ReservationWithZones): void {
    this.reservationData.set(reservation);
    this.reservantType.set(reservation.reservant_type as ReservantDto['type']);
    this.reservationRefreshToken.update((value) => value + 1);
  }

  // Role : Stocker le workflow charge pour adapter l'affichage.
  // Préconditions : `workflow` est charge par le composant enfant.
  // Postconditions : `presenteraJeux` est mis a jour.
  onWorkflowLoaded(workflow: WorkflowDto): void {
    this.presenteraJeux.set(workflow.presentera_jeux);
  }

  // Une méthode utilitaire pour savoir quel affichage montrer
  get showGameAllocation(): boolean {
    const type = this.reservantType();

    if (type === 'editeur' || type === 'boutique') return true;
    if (type === 'animateur' || type === 'prestataire' || type === 'association') {
      return this.presenteraJeux() === true;
    }

    return false;
  }

  get showGamePresenceChecklist(): boolean {
    const type = this.reservantType();
    const reservation = this.reservationData();

    if (type === 'editeur') return true;
    if (type === 'boutique') return false;
    if (type === 'animateur' || type === 'prestataire' || type === 'association') {
      return Boolean(reservation?.represented_editor_id);
    }

    return false;
  }
}
