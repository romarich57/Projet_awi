import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservantStore } from '../../stores/reservant.store';
import { ReservantDto } from '../../types/reservant-dto';
import { FestivalState } from '../../stores/festival-state';


@Component({
  selector: 'app-reservants-list-component',
  imports: [RouterLink],
  templateUrl: './reservants-list-component.html',
  styleUrl: './reservants-list-component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ReservantsListComponent {
  readonly reservantStore = inject(ReservantStore);
  private readonly festivalState = inject(FestivalState);
  readonly typeFilter = signal<'all' | ReservantDto['type']>('all');
  readonly sortKey = signal<'name-asc' | 'name-desc'>('name-asc');

  readonly reservantsView = computed(() => {
    const filtered =
      this.typeFilter() === 'all'
        ? this.reservantStore.reservants()
        : this.reservantStore.reservants().filter((r) => r.type === this.typeFilter());

    return [...filtered].sort((a, b) => {
      if (this.sortKey() === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  });

  constructor() {
    effect(() => {
      const festivalId = this.festivalState.currentFestivalId;
      this.reservantStore.setFestival(festivalId);
      if (festivalId == null) {
        this.reservantStore.loadAll();
      } else {
        this.reservantStore.loadByFestival(festivalId);
      }
    });
  }

  setTypeFilter(value: string): void {
    this.typeFilter.set(value as 'all' | ReservantDto['type']);
  }

  setSortKey(value: string): void {
    this.sortKey.set(value as 'name-asc' | 'name-desc');
  }

  contactInfo(reservant: ReservantDto): string {
    const contacts = [reservant.email, reservant.phone_number].filter(Boolean);
    return contacts.length > 0 ? contacts.join(' / ') : 'Contact non renseigné';
  }
}
