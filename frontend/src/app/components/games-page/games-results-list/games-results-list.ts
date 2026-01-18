import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GameDto } from '../../../types/game-dto';
import type { GamesVisibleColumns } from '@app/types/games-page.types';
import { GameListItemComponent } from '../game-list-item/game-list-item';

@Component({
  selector: 'app-games-results-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, GameListItemComponent],
  templateUrl: './games-results-list.html',
  styleUrl: './games-results-list.scss',
})
// Role : Afficher la liste des resultats de jeux.
// Préconditions : `games` et `visibleColumns` sont fournis.
// Postconditions : Les actions d'edition/suppression sont disponibles via evenements.
export class GamesResultsListComponent {
  readonly games = input<readonly GameDto[]>([]);
  readonly visibleColumns = input.required<GamesVisibleColumns>();

  readonly view = output<GameDto>();
  readonly edit = output<GameDto>();
  readonly delete = output<GameDto>();
}
