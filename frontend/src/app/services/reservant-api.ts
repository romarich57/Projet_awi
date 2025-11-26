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


  list(): Observable<ReservantDto[]> {
    return this.http.get<ReservantDto[]>(this.reservantApiUrl);
  }

  getbyid(id: number): Observable<ReservantDto> {
    return this.http.get<ReservantDto>(this.reservantApiUrl + '/' + id);
  }
  create(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.post<ReservantDto>(this.reservantApiUrl, reservant);
  }
  update(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.put<ReservantDto>(this.reservantApiUrl + '/' + reservant.id, reservant);
  }
  delete(reservant: ReservantDto): Observable<ReservantDto> {
    return this.http.delete<ReservantDto>(this.reservantApiUrl + '/' + reservant.id);
  }

}

