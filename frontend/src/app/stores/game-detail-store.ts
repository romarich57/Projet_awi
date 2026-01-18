import { Injectable, computed, inject, signal } from '@angular/core';
import { GameApiService } from '@app/services/game-api';
import type { GameDto } from '@app/types/game-dto';

@Injectable()
export class GameDetailStore {
  private readonly gameApi = inject(GameApiService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _game = signal<GameDto | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly game = this._game.asReadonly();
  readonly title = computed(() => this._game()?.title ?? '');

  // Role : Initialiser le store en chargeant les details d'un jeu.
  // Preconditions : gameId doit etre un nombre valide (fini).
  // Postconditions : Si l'ID est valide, lance le chargement du jeu. Sinon, signale une erreur.
  init(gameId: number): void {
    if (!Number.isFinite(gameId)) {
      this._error.set('Identifiant de jeu invalide');
      this._game.set(null);
      return;
    }
    this.fetchGame(gameId);
  }

  // Role : Charger le jeu depuis l'API.
  // Preconditions : L'identifiant du jeu est valide.
  // Postconditions : Met a jour _game, _loading et _error selon la reponse.
  private fetchGame(id: number): void {
    this._loading.set(true);
    this._error.set(null);
    this.gameApi
      .get(id)
      .subscribe({
        next: (game) => this._game.set(game),
        error: (err) => {
          this._error.set(err?.message || 'Jeu introuvable');
          this._game.set(null);
        },
      })
      .add(() => this._loading.set(false));
  }
}
