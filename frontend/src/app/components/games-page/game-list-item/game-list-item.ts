import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GameDto } from '../../../types/game-dto';
import type { GamesVisibleColumns } from '@app/types/games-page.types';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';

@Component({
  selector: 'app-game-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-list-item.html',
  styleUrl: './game-list-item.scss',
})
// Role : Afficher une ligne de jeu dans la liste, avec actions.
// Préconditions : `game` et `visibleColumns` sont fournis par le parent.
// Postconditions : Les champs sont rendus et les actions peuvent etre emises.
export class GameListItemComponent {
  readonly game = input.required<GameDto>();
  readonly visibleColumns = input.required<GamesVisibleColumns>();

  readonly view = output<GameDto>();
  readonly edit = output<GameDto>();
  readonly delete = output<GameDto>();
  readonly safeImageUrl = computed(() => ensureHttpsUrl(this.game().image_url));
  readonly titleInitial = computed(() => {
    const title = this.game().title?.trim();
    return title ? title.charAt(0) : '?';
  });

  // Role : Ouvrir la vue detail du jeu.
  // Préconditions : `game` est defini.
  // Postconditions : L'evenement `view` est emis.
  onRowClick(): void {
    this.view.emit(this.game());
  }

  // Role : Emmettre l'edition en stoppant la propagation.
  // Préconditions : L'evenement de clic est present.
  // Postconditions : L'evenement `edit` est emis sans declencher la vue detail.
  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.game());
  }

  // Role : Emmettre la suppression en stoppant la propagation.
  // Préconditions : L'evenement de clic est present.
  // Postconditions : L'evenement `delete` est emis sans declencher la vue detail.
  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.game());
  }

  // Role : Construire le libelle de joueurs.
  // Préconditions : `game` contient les bornes min/max si disponibles.
  // Postconditions : Retourne un libelle formatte ou un symbole de remplacement.
  playersLabel(game: GameDto): string {
    if (game.min_players || game.max_players) {
      const min = game.min_players ?? '?';
      const max = game.max_players ?? '?';
      return `${min} - ${max}`;
    }
    return '—';
  }

  // Role : Construire le libelle d'age minimum.
  // Préconditions : `game` contient `min_age`.
  // Postconditions : Retourne un libelle d'age formate.
  ageLabel(game: GameDto): string {
    return `${game.min_age}+`;
  }

  // Role : Construire le libelle de duree.
  // Préconditions : `visibleColumns().duration` est lu pour savoir si on affiche.
  // Postconditions : Retourne un libelle de duree ou une chaine vide.
  durationLabel(game: GameDto): string {
    if (!this.visibleColumns().duration) return '';
    return game.duration_minutes ? `${game.duration_minutes} min` : '—';
  }

  // Role : Produire un extrait court de la description.
  // Préconditions : `game.description` peut etre vide.
  // Postconditions : Retourne une description tronquee si necessaire.
  descriptionSnippet(game: GameDto): string {
    if (!game.description) return '';
    const trimmed = game.description.trim();
    return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
  }
}
