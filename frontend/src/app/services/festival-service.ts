import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { FestivalDto } from '../types/festival-dto';
import { environment } from '@env/environment';
import { ZoneTarifaireDto } from '../types/zone-tarifaire-dto';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FestivalService {

  private http = inject(HttpClient);

  //signal des festivals
  festivals = signal<FestivalDto[]>([]);

  loadAllFestivals() {
    this.http.get<FestivalDto[]>(`${environment.apiUrl}/festivals`, 
    { withCredentials: true }
    ).subscribe({
      next: (festiavls) => {
        this.festivals.set(festiavls);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des festivals', err);
    }
    });
  }

  addFestival(festival: Partial<FestivalDto>): Observable<{festival: FestivalDto}> {
    return this.http.post<{festival: FestivalDto}>(
      `${environment.apiUrl}/festivals`,
      festival,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        // Ajouter le nouveau festival à la liste locale
        this.festivals.update(festivals => [...festivals, response.festival]);
        console.log('Festival ajouté avec succès:', response.festival);
      })
    );
  }

  addZoneTarifaire(zone_tarifaire: Partial<ZoneTarifaireDto>, festival_id: number): Observable<{zone_tarifaire: ZoneTarifaireDto}> {
    const zoneWithFestivalId = {
      ...zone_tarifaire,
      festival_id: festival_id
    };
    
    return this.http.post<{zone_tarifaire: ZoneTarifaireDto}>(
      `${environment.apiUrl}/zones-tarifaires`,
      zoneWithFestivalId,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        console.log('Zone tarifaire ajoutée avec succès:', response.zone_tarifaire);
      })
    );
  }
  
}
