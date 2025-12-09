import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { GameDto } from '../types/game-dto';
import type { MechanismDto } from '../types/mechanism-dto';

export type GamePayload = Partial<Omit<GameDto, 'id' | 'editor_name' | 'mechanisms'>> & {
  mechanismIds?: number[];
};

export type GameFilters = {
  title?: string;
  type?: string;
  editor_id?: number | string | null;
  min_age?: number | string | null;
};

@Injectable({
  providedIn: 'root',
})
export class GameApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/games`;
  private readonly mechanismsUrl = `${environment.apiUrl}/mechanisms`;

  list(filters: GameFilters = {}): Observable<GameDto[]> {
    let params = new HttpParams();
    if (filters.title) params = params.set('title', filters.title);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.editor_id) params = params.set('editor_id', String(filters.editor_id));
    if (filters.min_age !== undefined && filters.min_age !== null && filters.min_age !== '') {
      params = params.set('min_age', String(filters.min_age));
    }
    return this.http.get<GameDto[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<GameDto> {
    return this.http.get<GameDto>(`${this.baseUrl}/${id}`);
  }

  create(payload: GamePayload): Observable<GameDto> {
    return this.http.post<GameDto>(this.baseUrl, payload);
  }

  update(id: number, payload: GamePayload): Observable<GameDto> {
    return this.http.patch<GameDto>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listMechanisms(): Observable<MechanismDto[]> {
    return this.http.get<MechanismDto[]>(this.mechanismsUrl);
  }

  getMechanismsForGame(gameId: number): Observable<MechanismDto[]> {
    return this.http.get<MechanismDto[]>(`${this.baseUrl}/${gameId}/mechanisms`);
  }
}
