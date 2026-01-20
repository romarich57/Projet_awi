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

export interface ZonePlanSimpleAllocation extends ZonePlanReservationAllocation {
  reservant_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonePlanService {
  

  http = inject(HttpClient);
  readonly zonePlans = signal<ZonePlanDto[]>([]);

  // Role : Recuperer les zones de plan pour un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Met a jour le signal zonePlans avec les zones recues.
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

  // Role : Mettre a jour une zone de plan.
  // Preconditions : zonePlanId et festivalId sont valides, data contient les champs a modifier.
  // Postconditions : Recharge la liste des zones du festival.
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


  // Role : Ajouter une nouvelle zone de plan.
  // Preconditions : data est fourni et festivalId est valide.
  // Postconditions : Recharge la liste des zones du festival.
  addZonePlan(data: Partial<ZonePlanDto>, festivalId: number) {
    // Vérifier côté client si une zone de plan avec le même nom existe déjà dans ce festival
    const existing = this.zonePlans().find(z => z.festival_id === festivalId && z.name.trim().toLowerCase() === String(data.name).trim().toLowerCase());
    if (existing) {
      console.error('Erreur lors de l\'ajout de la nouvelle zone de plan de jeux: une zone avec ce nom existe déjà dans ce festival');
      return;
    }
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


  // Role : Supprimer une zone de plan.
  // Preconditions : zonePlanId et festivalId sont valides.
  // Postconditions : Recharge la liste des zones du festival.
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

  // Role : Recuperer les jeux alloues a une zone de plan.
  // Preconditions : zonePlanId est valide.
  // Postconditions : Retourne un Observable des jeux alloues.
  getJeuxAlloues(zonePlanId: number): Observable<AllocatedGameWithReservant[]> {
    return this.http.get<AllocatedGameWithReservant[]>(`/api/zone-plan/${zonePlanId}/jeux-alloues`, { withCredentials: true });
  }

  // Role : Recuperer les jeux non alloues a une zone pour un festival.
  // Preconditions : festivalId est valide, reservationId est optionnel.
  // Postconditions : Retourne un Observable des jeux non alloues.
  getJeuxNonAlloues(festivalId: number, reservationId?: number): Observable<AllocatedGameWithReservant[]> {
    const reservationParam = reservationId ? `?reservationId=${reservationId}` : '';
    return this.http.get<AllocatedGameWithReservant[]>(
      `/api/zone-plan/festival/${festivalId}/jeux-non-alloues${reservationParam}`,
      { withCredentials: true }
    );
  }

  // Role : Recuperer le stock global de tables par type pour un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable du stock.
  getStockTablesFestival(festivalId: number): Observable<ZoneTableStock> {
    return this.http.get<ZoneTableStock>(`/api/festivals/${festivalId}/stock-tables`, { withCredentials: true });
  }

  // Role : Assigner un jeu a une zone de plan.
  // Preconditions : allocationId et zonePlanId sont valides, les valeurs optionnelles sont coherentes.
  // Postconditions : Retourne un Observable de l'allocation mise a jour.
  assignerJeuAZone(
    allocationId: number, 
    zonePlanId: number | null, 
    nbTablesOccupees?: number,
    nbExemplaires?: number,
    tailleTableRequise?: 'standard' | 'grande' | 'mairie' | 'aucun',
    nbChaises?: number
  ): Observable<AllocatedGameWithReservant> {
    const payload: {
      zone_plan_id: number | null;
      nb_tables_occupees?: number;
      nb_exemplaires?: number;
      taille_table_requise?: string;
      nb_chaises?: number;
    } = { zone_plan_id: zonePlanId };

    if (nbTablesOccupees !== undefined) {
      payload.nb_tables_occupees = nbTablesOccupees;
    }
    if (nbExemplaires !== undefined) {
      payload.nb_exemplaires = nbExemplaires;
    }
    if (tailleTableRequise !== undefined) {
      payload.taille_table_requise = tailleTableRequise;
    }
    if (nbChaises !== undefined) {
      payload.nb_chaises = nbChaises;
    }
    return this.http.patch<AllocatedGameWithReservant>(`/api/jeux_alloues/${allocationId}`, payload, { withCredentials: true });
  }

  // Role : Recuperer les allocations simples (tables sans jeux) d'une reservation.
  // Preconditions : reservationId est valide.
  // Postconditions : Retourne un Observable des allocations simples.
  getReservationAllocations(reservationId: number): Observable<ZonePlanReservationAllocation[]> {
    return this.http.get<ZonePlanReservationAllocation[]>(
      `/api/zone-plan/reservation/${reservationId}/allocations`,
      { withCredentials: true }
    );
  }

  // Role : Creer ou mettre a jour une allocation simple (tables sans jeux).
  // Preconditions : reservationId, zonePlanId et nbTables sont valides.
  // Postconditions : Retourne un Observable de l'allocation mise a jour.
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

  // Role : Supprimer une allocation simple (tables sans jeux).
  // Preconditions : reservationId et zonePlanId sont valides.
  // Postconditions : Retourne un Observable avec le message de suppression.
  deleteReservationAllocation(
    reservationId: number,
    zonePlanId: number
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/zone-plan/reservation/${reservationId}/allocations/${zonePlanId}`,
      { withCredentials: true }
    );
  }

  // Role : Recuperer les allocations simples globales par zone pour un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des allocations globales simples.
  getFestivalAllocationsSummary(festivalId: number): Observable<ZonePlanAllocationSummary[]> {
    return this.http.get<ZonePlanAllocationSummary[]>(
      `/api/zone-plan/festival/${festivalId}/allocations-simple`,
      { withCredentials: true }
    );
  }

  // Role : Recuperer les allocations simples d'une zone de plan.
  // Preconditions : zonePlanId est valide.
  // Postconditions : Retourne un Observable des allocations simples.
  getZoneSimpleAllocations(zonePlanId: number): Observable<ZonePlanSimpleAllocation[]> {
    return this.http.get<ZonePlanSimpleAllocation[]>(
      `/api/zone-plan/${zonePlanId}/allocations-simples`,
      { withCredentials: true }
    );
  }

  // Role : Recuperer les allocations globales (simples + jeux) par zone.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des allocations globales.
  getFestivalAllocationsGlobal(festivalId: number): Observable<ZonePlanAllocationSummary[]> {
    return this.http.get<ZonePlanAllocationSummary[]>(
      `/api/zone-plan/festival/${festivalId}/allocations-global`,
      { withCredentials: true }
    );
  }

}
