import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ZonePlanDto } from '@app/types/zone-plan-dto';

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

}
