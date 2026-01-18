import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReservantDto } from '../types/reservant-dto';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ReservantApiService {

  private readonly http = inject(HttpClient);
  private readonly reservantApiUrl = environment.apiUrl + '/reservant';


  // Role : Recuperer la liste des reservants.
  // Preconditions : Aucune.
  // Postconditions : Retourne un Observable des reservants.
  list(): Observable<ReservantDto[]> {
    return this.http.get<ReservantDto[]>(this.reservantApiUrl, { withCredentials: true });
  }

  // Role : Recuperer un reservant par identifiant.
  // Preconditions : id est valide.
  // Postconditions : Retourne un Observable du reservant.
  getbyid(id: number): Observable<ReservantDto> {
    return this.http.get<ReservantDto>(this.reservantApiUrl + '/' + id, { withCredentials: true });
  }
  // Role : Creer un reservant.
  // Preconditions : Le reservant fourni est valide.
  // Postconditions : Retourne un Observable du reservant cree.
  create(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.post<ReservantDto>(this.reservantApiUrl, reservant, { withCredentials: true });
  }
  // Role : Mettre a jour un reservant.
  // Preconditions : Le reservant fourni possede un id.
  // Postconditions : Retourne un Observable du reservant mis a jour.
  update(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.put<ReservantDto>(this.reservantApiUrl + '/' + reservant.id, reservant, { withCredentials: true });
  }
  // Role : Supprimer un reservant.
  // Preconditions : Le reservant fourni possede un id.
  // Postconditions : Retourne un Observable du reservant supprime.
  delete(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.delete<ReservantDto>(this.reservantApiUrl + '/' + reservant.id, { withCredentials: true });
  }

}
