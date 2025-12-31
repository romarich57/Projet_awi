import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoneTarifaireService {
  
  private readonly http = inject(HttpClient);

  getZonesTarifaires(festivalId: number): Observable<ZoneTarifaireDto[]> {
    return this.http.get<ZoneTarifaireDto[]>(`/api/zones-tarifaires/${festivalId}`, { withCredentials: true });
  }
}
