import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ReservantDto } from '../types/reservant-dto';
import { ReservationDetailDto } from '../types/reservation-detail-dto';
import { ZoneTarifaireDto } from '../types/zone-tarifaire-dto';
import { ReservationDto } from '../types/reservation-dto';
import { Observable } from 'rxjs';

export interface ZoneStock {
  id: number;
  name: string;
  total_tables: number;
  available_tables: number;
  reserved_tables: number;
  price_per_table: number;
}

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
  createReservation(reservation: any): Observable<{message: string, reservation: any}> {
    return this.http.post<{message: string, reservation: any}>(`${environment.apiUrl}/reservation/reservation`, 
      reservation, { withCredentials: true });
  }

  //Récupérer le stock disponible par zone tarifaire pour un festival
  getStockByFestival(festivalId: number): Observable<ZoneStock[]> {
    return this.http.get<ZoneStock[]>(`${environment.apiUrl}/reservation/stock/${festivalId}`,
       { withCredentials: true });
  }

  //Mettre à jour une réservation
  updateReservation(reservationId: number, data: {
    start_price?: number;
    nb_prises?: number;
    final_price?: number;
    table_discount_offered?: number;
    direct_discount?: number;
    note?: string;
    zones_tarifaires?: { zone_tarifaire_id: number; nb_tables_reservees: number }[];
  }): Observable<{message: string, reservation: ReservationDto}> {
    return this.http.put<{message: string, reservation: ReservationDto}>(
      `${environment.apiUrl}/reservation/reservation/${reservationId}`,
      data,
      { withCredentials: true }
    );
  }

  //Récupérer une réservation par son ID avec ses zones tarifaires
  getReservationById(reservationId: number): Observable<ReservationWithZones> {
    return this.http.get<ReservationWithZones>(
      `${environment.apiUrl}/reservation/detail/${reservationId}`,
      { withCredentials: true }
    );
  }

}

export interface ReservationWithZones {
  id: number;
  reservant_id: number;
  festival_id: number;
  workflow_id: number;
  start_price: number;
  table_discount_offered: number;
  direct_discount: number;
  nb_prises: number;
  date_facturation?: string;
  final_price: number;
  statut_paiement: string;
  note?: string;
  reservant_name: string;
  reservant_email: string;
  reservant_type: string;
  festival_name: string;
  zones_tarifaires: {
    zone_tarifaire_id: number;
    nb_tables_reservees: number;
    zone_name: string;
    price_per_table: number;
    nb_tables_available: number;
  }[];
}  
