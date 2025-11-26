import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservantStore } from '../../stores/reservant.store';
import { ReservantDto } from '../../types/reservant-dto';


@Component({
  selector: 'app-reservants-list-component',
  imports: [RouterLink],
  templateUrl: './reservants-list-component.html',
  styleUrl: './reservants-list-component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ReservantsListComponent implements OnInit {
  readonly reservantStore = inject(ReservantStore);
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

  ngOnInit() {
    this.reservantStore.loadAll();
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
