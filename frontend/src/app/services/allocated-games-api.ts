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

    // Role : Recuperer les jeux alloues pour un reservant et un festival.
    // Preconditions : festivalId et reservantId sont valides.
    // Postconditions : Retourne un Observable des jeux alloues.
    list(festivalId: number, reservantId: number): Observable<AllocatedGameDto[]> {
        return this.http.get<AllocatedGameDto[]>(
            `${this.festivalsUrl}/${festivalId}/reservants/${reservantId}/games`,
        );
    }

    // Role : Ajouter un jeu alloue pour un reservant sur un festival.
    // Preconditions : festivalId, reservantId et payload sont valides.
    // Postconditions : Retourne un Observable du jeu alloue cree.
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

    // Role : Mettre a jour un jeu alloue.
    // Preconditions : allocationId est valide et payload contient les champs a modifier.
    // Postconditions : Retourne un Observable du jeu alloue mis a jour.
    update(allocationId: number, payload: AllocationUpdatePayload): Observable<AllocatedGameDto> {
        return this.http.patch<AllocatedGameDto>(`${this.allocationUrl}/${allocationId}`, payload);
    }

    // Role : Supprimer un jeu alloue.
    // Preconditions : allocationId est valide.
    // Postconditions : Retourne un Observable void apres suppression.
    delete(allocationId: number): Observable<void> {
        return this.http.delete<void>(`${this.allocationUrl}/${allocationId}`);
    }
}
