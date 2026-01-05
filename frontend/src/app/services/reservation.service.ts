import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ReservantDto } from '../types/reservant-dto';
import { ReservationDetailDto } from '../types/reservation-detail-dto';
import { Observable } from 'rxjs';
import { ZoneTarifaireDto } from '../types/zone-tarifaire-dto';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {

  http = inject(HttpClient);
  
  //Lister les réservants d'un festival
  getReservantsByFestival(festivalId: number): Observable<ReservantDto[]> {
    return this.http.get<ReservantDto[]>(`${environment.apiUrl}/reservation/${festivalId}`,
       { withCredentials: true });
  }

  //Lister les réservations complètes d'un festival  
  getReservationsByFestival(festivalId: number): Observable<ReservationDetailDto[]> {
    return this.http.get<ReservationDetailDto[]>(`${environment.apiUrl}/reservation/reservations/${festivalId}`,
       { withCredentials: true });
  }

  //Créer une nouvelle réservation
  // createReservation(reservation: any): Observable<{message: string, reservation: any}> {
  //   return this.http.post<{message: string, reservation: any}>(`${environment.apiUrl}/reservation/reservation`, 
  //     reservation, { withCredentials: true });
  // }
    createReservation(data: any): Observable<any> {
    return this.http.post('/api/reservation', data);
  }

      getZonesTarifaires(festivalId: number): Observable<ZoneTarifaireDto[]> {
    console.log('🔄 Récupération zones tarifaires pour festival:', festivalId);
    return this.http.get<ZoneTarifaireDto[]>(`/api/zones-tarifaires/${festivalId}`);
  }

//   // La méthode createReservation existe déjà et accepte maintenant le champ 'zones'
//   createReservation(data: any): Observable<any> {
//     return this.http.post('/api/reservations', data);
// }

}  
