import { Injectable, signal } from '@angular/core';
import { FestivalDto } from '../types/festival-dto';

@Injectable({
  providedIn: 'root',
})
export class FestivalState {

  // 1. L'ÉTAT PRIVÉ 
  // Stocker le festival complet au lieu de juste l'ID
  private readonly _currentFestival = signal<FestivalDto | null>(null);

  // 2. L'ÉTAT PUBLIC 
  // On expose le signal en "lecture seule"
  public readonly currentFestival = this._currentFestival.asReadonly();

  get currentFestivalId(): number | null {
    return this.currentFestival()?.id ?? null;
  }

  // 4. LES ACTIONS 

  // Role : Mettre a jour le festival courant dans l'etat global.
  // Preconditions : Aucune (accepte un objet FestivalDto ou null).
  // Postconditions : Le signal _currentFestival est mis a jour avec la nouvelle valeur.
  setCurrentFestival(festival: FestivalDto | null): void {
    this._currentFestival.set(festival);
  }
}
