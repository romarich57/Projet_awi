import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservantDto } from '../../types/reservant-dto';
import { ReservantStore } from '../../stores/reservant.store';

@Component({
  selector: 'app-reservant-card-component',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservant-card-component.html',
  styleUrl: './reservant-card-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservantCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly reservantStore = inject(ReservantStore);

  readonly reservantInput = input<ReservantDto | null>(null, { alias: 'reservant' });
  private readonly reservantIdParam = this.route.snapshot.paramMap.get('id');
  readonly reservantId = this.reservantIdParam ? Number(this.reservantIdParam) : null;
  readonly isPageContext = this.reservantId !== null;

  readonly reservant = computed(() => {
    if (this.reservantInput()) {
      return this.reservantInput();
    }
    if (this.reservantId === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === this.reservantId) ?? null;
  });

  ngOnInit(): void {
    if (!this.reservantInput() && this.reservantId !== null) {
      this.reservantStore.loadById(this.reservantId);
    }
  }

  typeLabel(type: ReservantDto['type']): string {
    const labels: Record<ReservantDto['type'], string> = {
      editeur: 'Editeur',
      prestataire: 'Prestataire',
      boutique: 'Boutique',
      animateur: 'Animateur',
      association: 'Association',
    };
    return labels[type];
  }

  displayValue(value?: string | null): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : 'Non renseigne';
  }

}
