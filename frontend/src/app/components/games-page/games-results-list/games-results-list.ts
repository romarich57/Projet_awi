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
export class GamesResultsListComponent {
  readonly games = input<readonly GameDto[]>([]);
  readonly visibleColumns = input.required<GamesVisibleColumns>();

  readonly edit = output<GameDto>();
  readonly delete = output<GameDto>();
}
