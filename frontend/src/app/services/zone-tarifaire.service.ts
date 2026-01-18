import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoneTarifaireService {
  
  private readonly http = inject(HttpClient);

  // Role : Recuperer les zones tarifaires d'un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des zones tarifaires du festival.
  getZonesTarifaires(festivalId: number): Observable<ZoneTarifaireDto[]> {
    return this.http.get<ZoneTarifaireDto[]>(`/api/zones-tarifaires/${festivalId}`, { withCredentials: true });
  }

  // Role : Recuperer les zones tarifaires ayant au moins une reservation.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des zones tarifaires avec reservations.
  getZonesTarifairesWithReservations(festivalId: number): Observable<ZoneTarifaireDto[]> {
    return this.http.get<ZoneTarifaireDto[]>(`/api/zones-tarifaires/${festivalId}/with-reservations`, { withCredentials: true });
  }
}
