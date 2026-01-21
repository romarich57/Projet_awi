import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ReservantDto } from '../types/reservant-dto';
import { ReservationDetailDto } from '../types/reservation-detail-dto';
import { ZoneTarifaireDto } from '../types/zone-tarifaire-dto';
import { ReservationDto } from '../types/reservation-dto';
import { Observable } from 'rxjs';
import { FestivalDto } from '@app/types/festival-dto';

export interface ZoneStock {
  id: number;
  name: string;
  total_tables: number;
  available_tables: number;
  reserved_tables: number;
  price_per_table: number;
}

export interface ChaisesStock {
  total: number;
  available: number;
  reserved: number;
}

export interface StockResponse {
  zones: ZoneStock[];
  chaises: ChaisesStock;
}

export interface ReservationZoneTarifairePayload {
  zone_tarifaire_id: number;
  nb_tables_reservees: number;
  nb_chaises_reservees?: number;
}

export interface ReservationCreatePayload {
  reservant_name: string;
  reservant_email: string;
  reservant_type: ReservantDto['type'];
  festival_id: number;
  editor_name?: string;
  editor_email?: string;
  start_price: number;
  nb_prises: number;
  final_price: number;
  table_discount_offered?: number;
  direct_discount?: number;
  note?: string;
  phone_number?: string;
  address?: string;
  siret?: string;
  represented_editor_id?: number | null;
  zones_tarifaires?: ReservationZoneTarifairePayload[];
}

export interface ReservationCreateResponse {
  message: string;
  reservation: ReservationDto & {
    reservant_name: string;
    reservant_email: string;
    reservant_type: ReservantDto['type'];
    editor_name: string | null;
    editor_email: string | null;
    workflow_state: string;
    festival_name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {

  http = inject(HttpClient);

  // Role : Lister les reservants d'un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des reservants.
  getReservantsByFestival(festivalId: number): Observable<ReservantDto[]> {
    return this.http.get<ReservantDto[]>(`${environment.apiUrl}/reservation/${festivalId}`,
      { withCredentials: true });
  }

  // Role : Lister les reservations completes d'un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable des reservations detaillees.
  getReservationsByFestival(festivalId: number): Observable<ReservationDetailDto[]> {
    return this.http.get<ReservationDetailDto[]>(`${environment.apiUrl}/reservation/reservations/${festivalId}`,
      { withCredentials: true });
  }

  // Role : Creer une nouvelle reservation.
  // Preconditions : L'objet reservation contient les champs requis.
  // Postconditions : Retourne un Observable avec la reservation creee.
  createReservation(reservation: ReservationCreatePayload): Observable<ReservationCreateResponse> {
    return this.http.post<ReservationCreateResponse>(`${environment.apiUrl}/reservation/reservation`,
      reservation, { withCredentials: true });
  }

  // Role : Recuperer le stock disponible par zone tarifaire pour un festival.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable du stock par zone et chaises.
  getStockByFestival(festivalId: number): Observable<StockResponse> {
    return this.http.get<StockResponse>(`${environment.apiUrl}/reservation/stock/${festivalId}`,
      { withCredentials: true });
  }


  // Role : Recuperer les details d'un festival par son ID.
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne un Observable du festival.
  getFestival(festivalId: number): Observable<FestivalDto> {
    return this.http.get<FestivalDto>(
      `${environment.apiUrl}/festivals/${festivalId}`,
      { withCredentials: true }
    );
  }

  // Role : Recuperer uniquement le stock de chaises (avec le calcul corrigé des jeux).
  // Preconditions : festivalId est valide.
  // Postconditions : Retourne le stock total et disponible.
  getStockChaises(festivalId: number): Observable<{ chaises: { total: number; available: number } }> {

    return this.http.get<{ chaises: { total: number; available: number } }>(
      `${environment.apiUrl}/festivals/${festivalId}/stock-chaises`,
      { withCredentials: true }
    );
  }

  // Role : Mettre a jour une reservation.
  // Preconditions : reservationId est valide et data contient les champs a modifier.
  // Postconditions : Retourne un Observable de la reservation mise a jour.
  updateReservation(reservationId: number, data: {
    start_price?: number;
    nb_prises?: number;
    final_price?: number;
    table_discount_offered?: number;
    direct_discount?: number;
    note?: string;
    zones_tarifaires?: { zone_tarifaire_id: number; nb_tables_reservees: number; nb_chaises_reservees: number }[];
  }): Observable<{ message: string, reservation: ReservationDto }> {
    return this.http.put<{ message: string, reservation: ReservationDto }>(
      `${environment.apiUrl}/reservation/reservation/${reservationId}`,
      data,
      { withCredentials: true }
    );
  }

  // Role : Recuperer une reservation par son ID avec ses zones tarifaires.
  // Preconditions : reservationId est valide.
  // Postconditions : Retourne un Observable de la reservation detaillee.
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
  represented_editor_id?: number | null;
  reservant_name: string;
  reservant_email: string;
  reservant_type: string;
  festival_name: string;
  zones_tarifaires: {
    zone_tarifaire_id: number;
    nb_tables_reservees: number;
    nb_chaises_reservees: number;
    zone_name: string;
    price_per_table: number;
    nb_tables_available: number;
  }[];
  chaises_stock?: {
    total: number;
    available: number;
  };
}  
