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

    // Signal des festivals
    festivals = signal<FestivalDto[]>([]);


    // Role : Charger le dernier festival et le placer dans le signal.
    // Preconditions : L'API est accessible.
    // Postconditions : Le signal festivals est mis a jour avec la derniere entree.
    loadLastFestival() {
        this.http.get<FestivalDto[]>(`${environment.apiUrl}/festivals?limit=1&sort=desc`,
            { withCredentials: true }
        ).subscribe({
            next: (festivals) => {
                this.festivals.set(festivals);
            },
            error: (err) => {
                console.error('Erreur lors du chargement du dernier festival', err);
            }
        });
    }

    // Role : Charger tous les festivals.
    // Preconditions : L'API est accessible.
    // Postconditions : Le signal festivals est mis a jour.
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

    // Role : Creer un festival et l'ajouter a la liste locale.
    // Preconditions : Le festival partiel contient les champs requis.
    // Postconditions : Retourne un Observable avec le festival cree et met a jour le signal.
    addFestival(festival: Partial<FestivalDto>): Observable<{ festival: FestivalDto }> {
        return this.http.post<{ festival: FestivalDto }>(
            `${environment.apiUrl}/festivals`,
            festival,
            { withCredentials: true }
        ).pipe(
            tap((response) => {
                console.log('Festival ajouté avec succès:', response.festival);
                this.loadAllFestivals();
            })
        );
    }

    // Role : Creer une zone tarifaire pour un festival.
    // Preconditions : zone_tarifaire est valide et festival_id est fourni.
    // Postconditions : Retourne un Observable de la zone tarifaire creee.
    addZoneTarifaire(zone_tarifaire: Partial<ZoneTarifaireDto>, festival_id: number): Observable<{ zone_tarifaire: ZoneTarifaireDto }> {
        const zoneWithFestivalId = {
            ...zone_tarifaire,
            festival_id: festival_id
        };

        return this.http.post<{ zone_tarifaire: ZoneTarifaireDto }>(
            `${environment.apiUrl}/zones-tarifaires`,
            zoneWithFestivalId,
            { withCredentials: true }
        ).pipe(
            tap((response) => {
                console.log('Zone tarifaire ajoutée avec succès:', response.zone_tarifaire);
            })
        );
    }

    // Role : Supprimer un festival et mettre a jour la liste locale.
    // Preconditions : festivalId est un identifiant valide.
    // Postconditions : Supprime le festival cote serveur et retire l'entree du signal.
    deleteFestival(festivalId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${environment.apiUrl}/festivals/${festivalId}`,
            { withCredentials: true },
        ).pipe(
            tap(() => {
                this.loadAllFestivals();
            }),
        );
    }
}
