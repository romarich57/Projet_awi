import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameDetailStore } from '@app/stores/game-detail-store';
import { GameImagePreviewComponent } from '@app/components/game-create/components/game-image-preview/game-image-preview';
import { GameVideoPreviewComponent } from '@app/components/game-create/components/game-video-preview/game-video-preview';

@Component({
  selector: 'app-game-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, GameImagePreviewComponent, GameVideoPreviewComponent],
  templateUrl: './game-detail-page.html',
  styleUrl: './game-detail-page.scss',
  providers: [GameDetailStore],
})
// Role : Afficher les details d un jeu en lecture seule.
// Préconditions : L id du jeu est present dans l URL.
// Postconditions : Les donnees du jeu sont chargees et affichees sans edition.
export class GameDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(GameDetailStore);

  readonly game = this.store.game;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly title = this.store.title;

  readonly editorLabel = computed(() => this.game()?.editor_name || '—');
  readonly ageLabel = computed(() => {
    const game = this.game();
    return game ? `${game.min_age}+` : '—';
  });
  readonly playersLabel = computed(() => {
    const game = this.game();
    if (!game) return '—';
    if (game.min_players || game.max_players) {
      const min = game.min_players ?? '?';
      const max = game.max_players ?? '?';
      return `${min} - ${max}`;
    }
    return '—';
  });
  readonly durationLabel = computed(() => {
    const game = this.game();
    if (!game) return '—';
    return game.duration_minutes ? `${game.duration_minutes} min` : '—';
  });
  readonly mechanisms = computed(() => this.game()?.mechanisms ?? []);
  readonly hasMechanisms = computed(() => this.mechanisms().length > 0);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : Number.NaN;
    this.store.init(id);
  }

  goBack(): void {
    this.router.navigate(['/games']);
  }
}
