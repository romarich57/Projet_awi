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

  // Role : Recuperer la liste des jeux avec filtres optionnels.
  // Preconditions : Les filtres sont valides et optionnels.
  // Postconditions : Retourne un Observable de jeux correspondant aux criteres.
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

  // Role : Recuperer un jeu par identifiant.
  // Preconditions : id est valide.
  // Postconditions : Retourne un Observable du jeu demande.
  get(id: number): Observable<GameDto> {
    return this.http.get<GameDto>(`${this.baseUrl}/${id}`);
  }

  // Role : Creer un nouveau jeu.
  // Preconditions : payload contient les champs necessaires.
  // Postconditions : Retourne un Observable du jeu cree.
  create(payload: GamePayload): Observable<GameDto> {
    return this.http.post<GameDto>(this.baseUrl, payload);
  }

  // Role : Mettre a jour un jeu existant.
  // Preconditions : id est valide et payload contient les champs a modifier.
  // Postconditions : Retourne un Observable du jeu mis a jour.
  update(id: number, payload: GamePayload): Observable<GameDto> {
    return this.http.patch<GameDto>(`${this.baseUrl}/${id}`, payload);
  }

  // Role : Supprimer un jeu par identifiant.
  // Preconditions : id est valide.
  // Postconditions : Retourne un Observable void lorsque la suppression reussit.
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Role : Recuperer la liste des mecanismes.
  // Preconditions : Aucune.
  // Postconditions : Retourne un Observable des mecanismes disponibles.
  listMechanisms(): Observable<MechanismDto[]> {
    return this.http.get<MechanismDto[]>(this.mechanismsUrl);
  }

  // Role : Recuperer les mecanismes associes a un jeu.
  // Preconditions : gameId est valide.
  // Postconditions : Retourne un Observable des mecanismes du jeu.
  getMechanismsForGame(gameId: number): Observable<MechanismDto[]> {
    return this.http.get<MechanismDto[]>(`${this.baseUrl}/${gameId}/mechanisms`);
  }
}
