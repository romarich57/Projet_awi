import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AllocatedGameDto, TableSize } from '../types/allocated-game-dto';

export type AllocationPayload = {
  game_id: number;
  nb_exemplaires: number;
  nb_tables_occupees: number;
  zone_plan_id?: number | null;
  taille_table_requise?: TableSize;
};

export type AllocationUpdatePayload = Partial<Omit<AllocationPayload, 'game_id'>>;

@Injectable({
  providedIn: 'root',
})
export class AllocatedGamesApiService {
  private readonly http = inject(HttpClient);
  private readonly festivalsUrl = `${environment.apiUrl}/festivals`;
  private readonly allocationUrl = `${environment.apiUrl}/jeux_alloues`;

  list(festivalId: number, reservantId: number): Observable<AllocatedGameDto[]> {
    return this.http.get<AllocatedGameDto[]>(
      `${this.festivalsUrl}/${festivalId}/reservants/${reservantId}/games`,
    );
  }

  add(
    festivalId: number,
    reservantId: number,
    payload: AllocationPayload,
  ): Observable<AllocatedGameDto> {
    return this.http.post<AllocatedGameDto>(
      `${this.festivalsUrl}/${festivalId}/reservants/${reservantId}/games`,
      payload,
    );
  }

  update(allocationId: number, payload: AllocationUpdatePayload): Observable<AllocatedGameDto> {
    return this.http.patch<AllocatedGameDto>(`${this.allocationUrl}/${allocationId}`, payload);
  }

  delete(allocationId: number): Observable<void> {
    return this.http.delete<void>(`${this.allocationUrl}/${allocationId}`);
  }
}
