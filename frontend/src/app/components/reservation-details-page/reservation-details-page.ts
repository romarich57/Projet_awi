import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationDetailComponent } from '../reservation-detail-component/reservation-detail-component';
import { WorkflowComponent } from '../workflow-component/workflow-component';
import { ZonePlanJeux } from '../zone-plan-jeux/zone-plan-jeux';
import { ZonePlanSimple } from '../zone-plan-simple/zone-plan-simple';
import { CommonModule } from '@angular/common';
import type { ReservationWithZones } from '@app/services/reservation.service';
import type { WorkflowDto } from '@app/types/workflow-dto';
import type { ReservantDto } from '@app/types/reservant-dto';

@Component({
  selector: 'app-reservation-details-page',
  imports: [CommonModule, RouterLink, ReservationDetailComponent, WorkflowComponent, ZonePlanJeux, ZonePlanSimple],
  templateUrl: './reservation-details-page.html',
  styleUrl: './reservation-details-page.scss'
})
export class ReservationDetailsPage implements OnInit {
  
  private readonly activatedRoute = inject(ActivatedRoute);
  
  readonly reservationId = signal<number | null>(null);
  readonly festivalId = signal<number | null>(null);
  readonly reservationData = signal<ReservationWithZones | null>(null);
  readonly reservantType = signal<ReservantDto['type'] | null>(null);
  readonly presenteraJeux = signal<boolean | null>(null);

  ngOnInit(): void {
    // Récupérer l'ID de l'URL
    const id = this.activatedRoute.snapshot.params['id'];
    const festivalId = this.activatedRoute.snapshot.queryParams['festivalId'];
    
    if (id) {
      this.reservationId.set(+id);
    }
    if (festivalId) {
      this.festivalId.set(+festivalId);
    }
  }

  onReservationLoaded(reservation: ReservationWithZones): void {
    this.reservationData.set(reservation);
    this.reservantType.set(reservation.reservant_type as ReservantDto['type']);
  }

  onWorkflowLoaded(workflow: WorkflowDto): void {
    this.presenteraJeux.set(workflow.presentera_jeux);
  }

  // Une méthode utilitaire pour savoir quel affichage montrer
  get showGameAllocation(): boolean {
    const type = this.reservantType();

    if (type === 'editeur') return true;
    if (type === 'animateur') return this.presenteraJeux() === true;

    return false;
  }
}
