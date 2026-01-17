import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import type { AllocatedGameDto, ZoneTableStock } from '@app/types/allocated-game-dto';
import { Observable } from 'rxjs';

// Interface étendue pour les jeux alloués avec info réservant
export interface AllocatedGameWithReservant extends AllocatedGameDto {
  reservant_id: number;
  reservant_name: string;
}

export interface ZonePlanReservationAllocation {
  reservation_id: number;
  zone_plan_id: number;
  nb_tables: number;
  nb_chaises: number;
}

export interface ZonePlanAllocationSummary {
  zone_plan_id: number;
  nb_tables: number;
  nb_chaises: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZonePlanService {
  

  http = inject(HttpClient);
  readonly zonePlans = signal<ZonePlanDto[]>([]);

  //Méthode pour obtenir les zones de plans de jeux
  getZonePlans(festivalId: number) {
    this.http.get<ZonePlanDto[]>(`/api/zone-plan/${festivalId}`, { withCredentials: true }).subscribe({
      next: (zonePlans) => {
        this.zonePlans.set(zonePlans);
        console.log('Zones de plans de jeux obtenues:', zonePlans);
      },
      error: (err) => {
        console.error('Erreur lors de l\'obtention des zones de plans de jeux', err);
      }
    });
  }

  //méthode pour mettre à jour une zone de plan de jeux
  setZonePlan(zonePlanId: number, data: Partial<ZonePlanDto>, festivalId: number) {
    return this.http.put<ZonePlanDto>(`/api/zone-plan/${zonePlanId}`, data, { withCredentials: true }).subscribe({
      next: (updatedZonePlan) => {
        console.log('Zone de plan de jeux mise à jour:', updatedZonePlan);
        // Rafraîchir la liste des zones
        this.getZonePlans(festivalId);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la zone de plan de jeux', err);
      }
    });
  }


  //méthode pour ajouter une nouvelle zone de plan de jeux
  addZonePlan(data: Partial<ZonePlanDto>, festivalId: number) {
    const payload = { ...data, festival_id: festivalId };
    return this.http.post<ZonePlanDto>(`/api/zone-plan`, payload, { withCredentials: true }).subscribe({
      next: (newZonePlan) => {
        console.log('Nouvelle zone de plan de jeux ajoutée:', newZonePlan);
        // Rafraîchir la liste des zones
        this.getZonePlans(festivalId);
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout de la nouvelle zone de plan de jeux', err);
      }
    });
  }


  deleteZonePlan(zonePlanId: number, festivalId: number) {
    return this.http.delete(`/api/zone-plan/${zonePlanId}`, { withCredentials: true }).subscribe({
      next: () => {
        console.log('Zone de plan de jeux supprimée:', zonePlanId);
        // Rafraîchir la liste des zones
        this.getZonePlans(festivalId);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression de la zone de plan de jeux', err);
      }
    });
  }

  // Récupérer les jeux alloués à une zone de plan
  getJeuxAlloues(zonePlanId: number): Observable<AllocatedGameWithReservant[]> {
    return this.http.get<AllocatedGameWithReservant[]>(`/api/zone-plan/${zonePlanId}/jeux-alloues`, { withCredentials: true });
  }

  // Récupérer les jeux non alloués à aucune zone pour un festival
  getJeuxNonAlloues(festivalId: number, reservationId?: number): Observable<AllocatedGameWithReservant[]> {
    const reservationParam = reservationId ? `?reservationId=${reservationId}` : '';
    return this.http.get<AllocatedGameWithReservant[]>(
      `/api/zone-plan/festival/${festivalId}/jeux-non-alloues${reservationParam}`,
      { withCredentials: true }
    );
  }

  // Récupérer le stock global de tables par type depuis le festival
  getStockTablesFestival(festivalId: number): Observable<ZoneTableStock> {
    return this.http.get<ZoneTableStock>(`/api/festivals/${festivalId}/stock-tables`, { withCredentials: true });
  }

  // Assigner un jeu à une zone de plan
  assignerJeuAZone(
    allocationId: number, 
    zonePlanId: number | null, 
    nbTablesOccupees?: number,
    nbExemplaires?: number,
    tailleTableRequise?: 'standard' | 'grande' | 'mairie' | 'aucun'
  ): Observable<AllocatedGameWithReservant> {
    const payload: {  // Playload sert à envoyer les données nécessaires à la mise à jour de l'allocation de jeu
      zone_plan_id: number | null; 
      nb_tables_occupees?: number;
      nb_exemplaires?: number;
      taille_table_requise?: string;
    } = { zone_plan_id: zonePlanId };
    
    if (nbTablesOccupees !== undefined) { // Vérifie si nbTablesOccupees est défini avant de l'ajouter au payload 
      payload.nb_tables_occupees = nbTablesOccupees;
    }
    if (nbExemplaires !== undefined) {
      payload.nb_exemplaires = nbExemplaires;
    }
    if (tailleTableRequise !== undefined) {
      payload.taille_table_requise = tailleTableRequise;
    }
    //patch est utilisé pour mettre à jour partiellement une ressource existante sur le serveur
    return this.http.patch<AllocatedGameWithReservant>(`/api/jeux_alloues/${allocationId}`, payload, { withCredentials: true });
  }

  // Récupérer les allocations simples (tables sans jeux) d'une réservation
  getReservationAllocations(reservationId: number): Observable<ZonePlanReservationAllocation[]> {
    return this.http.get<ZonePlanReservationAllocation[]>(
      `/api/zone-plan/reservation/${reservationId}/allocations`,
      { withCredentials: true }
    );
  }

  // Créer ou mettre à jour une allocation simple (tables sans jeux)
  setReservationAllocation(
    reservationId: number,
    zonePlanId: number,
    nbTables: number,
    nbChaises: number = 0
  ): Observable<ZonePlanReservationAllocation> {
    return this.http.put<ZonePlanReservationAllocation>(
      `/api/zone-plan/reservation/${reservationId}/allocations/${zonePlanId}`,
      { nb_tables: nbTables, nb_chaises: nbChaises },
      { withCredentials: true }
    );
  }

  // Supprimer une allocation simple (tables sans jeux)
  deleteReservationAllocation(
    reservationId: number,
    zonePlanId: number
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/zone-plan/reservation/${reservationId}/allocations/${zonePlanId}`,
      { withCredentials: true }
    );
  }

  // Récupérer les allocations simples globales par zone (toutes réservations du festival)
  getFestivalAllocationsSummary(festivalId: number): Observable<ZonePlanAllocationSummary[]> {
    return this.http.get<ZonePlanAllocationSummary[]>(
      `/api/zone-plan/festival/${festivalId}/allocations-simple`,
      { withCredentials: true }
    );
  }

  // Récupérer les allocations globales (simples + jeux) par zone
  getFestivalAllocationsGlobal(festivalId: number): Observable<ZonePlanAllocationSummary[]> {
    return this.http.get<ZonePlanAllocationSummary[]>(
      `/api/zone-plan/festival/${festivalId}/allocations-global`,
      { withCredentials: true }
    );
  }

}
