import { Injectable, signal } from '@angular/core';
import { FestivalDto } from '../types/festival-dto';

@Injectable({
  providedIn: 'root',
})
export class FestivalState {
  
  // 1. L'ÉTAT PRIVÉ (Le coffre-fort)
  // Stocker le festival complet au lieu de juste l'ID
  private readonly _currentFestival = signal<FestivalDto | null>(null);

  // 2. L'ÉTAT PUBLIC (La vitrine)
  // On expose le signal en "lecture seule"
  public readonly currentFestival = this._currentFestival.asReadonly();

  // 3. Helper pour récupérer juste l'ID (pour la compatibilité)
  get currentFestivalId(): number | null {
    return this.currentFestival()?.id ?? null;
  }

  // 4. LES ACTIONS (Les clés du coffre-fort)

  setCurrentFestival(festival: FestivalDto | null): void {
    this._currentFestival.set(festival);
  }
}
