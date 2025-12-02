import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationDetailComponent } from '../reservation-detail-component/reservation-detail-component';
import { WorkflowComponent } from '../workflow-component/workflow-component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-details-page',
  imports: [CommonModule, RouterLink, ReservationDetailComponent, WorkflowComponent],
  templateUrl: './reservation-details-page.html',
  styleUrl: './reservation-details-page.scss'
})
export class ReservationDetailsPage implements OnInit {
  
  private readonly activatedRoute = inject(ActivatedRoute);
  
  readonly reservationId = signal<number | null>(null);

  ngOnInit(): void {
    // Récupérer l'ID de l'URL
    const id = this.activatedRoute.snapshot.params['id'];
    
    if (id) {
      this.reservationId.set(+id);
    }
  }
}
