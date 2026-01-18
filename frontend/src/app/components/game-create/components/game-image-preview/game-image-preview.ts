import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';

@Component({
  selector: 'app-game-image-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-image-preview.html',
  styleUrl: './game-image-preview.scss',
})
// Role : Afficher un apercu d'image pour un jeu.
// Préconditions : `imageUrl` est fourni (peut etre vide).
// Postconditions : Une URL securisee est calculee pour l'affichage.
export class GameImagePreviewComponent {
  readonly imageUrl = input<string>('');
  readonly safeImageUrl = computed(() => ensureHttpsUrl(this.imageUrl()));
}
