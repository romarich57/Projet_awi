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
export class GameListItemComponent {
  readonly game = input.required<GameDto>();
  readonly visibleColumns = input.required<GamesVisibleColumns>();

  readonly edit = output<GameDto>();
  readonly delete = output<GameDto>();
  readonly safeImageUrl = computed(() => ensureHttpsUrl(this.game().image_url));

  playersLabel(game: GameDto): string {
    if (game.min_players || game.max_players) {
      const min = game.min_players ?? '?';
      const max = game.max_players ?? '?';
      return `${min} - ${max}`;
    }
    return '—';
  }

  ageLabel(game: GameDto): string {
    return `${game.min_age}+`;
  }

  durationLabel(game: GameDto): string {
    if (!this.visibleColumns().duration) return '';
    return game.duration_minutes ? `${game.duration_minutes} min` : '—';
  }

  descriptionSnippet(game: GameDto): string {
    if (!game.description) return '';
    const trimmed = game.description.trim();
    return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
  }
}
