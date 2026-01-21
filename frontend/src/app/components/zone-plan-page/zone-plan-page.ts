import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZonePlanJeux } from '../zone-plan-jeux/zone-plan-jeux';
import { FestivalState } from '@app/stores/festival-state';

@Component({
  selector: 'app-zone-plan-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ZonePlanJeux],
  templateUrl: './zone-plan-page.html',
  styleUrl: './zone-plan-page.scss',
})
// Role : Afficher la page plan en lecture seule pour un festival.
// Préconditions : L'URL contient l'ID du festival.
// Postconditions : Le plan des zones est affiché pour le festival cible.
export class ZonePlanPageComponent {
  private readonly festivalState = inject(FestivalState);

  readonly festivalIdParam = input<string | null>(null, { alias: 'id' });
  readonly isReadOnly = input<boolean>(true, { alias: 'isReadOnly' });

  readonly festivalId = computed(() => {
    const idParam = this.festivalIdParam();
    const parsed = idParam ? Number(idParam) : null;
    return Number.isFinite(parsed) ? parsed : null;
  });

  readonly festivalName = computed(() => {
    const festival = this.festivalState.currentFestival();
    const id = this.festivalId();
    if (!festival || id === null || festival.id !== id) {
      return null;
    }
    return festival.name;
  });
}
