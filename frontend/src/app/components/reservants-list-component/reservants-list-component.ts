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
// Role : Afficher la liste des reservants avec filtres et tri.
// Préconditions : Le store ReservantStore est initialise et le festival courant est connu.
// Postconditions : La liste est chargee et filtree selon les selections utilisateur.
export class ReservantsListComponent {
  readonly reservantStore = inject(ReservantStore);
  private readonly festivalState = inject(FestivalState);
  readonly typeFilter = signal<'all' | ReservantDto['type']>('all');
  readonly sortKey = signal<'name-asc' | 'name-desc'>('name-asc');
  readonly searchQuery = signal(''); //recherche par nom


readonly reservantsView = computed(() => {
    // 1. On récupère la liste initiale
    let filtered = this.reservantStore.reservants();

    // 2. Filtre par TYPE
    if (this.typeFilter() !== 'all') {
        filtered = filtered.filter((r) => r.type === this.typeFilter());
    }

    // 3. NOUVEAU : Filtre par NOM (Recherche)
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
        filtered = filtered.filter((r) => 
            r.name?.toLowerCase().includes(query)
        );
    }

    // 4. Tri (Sort)
    return [...filtered].sort((a, b) => {
        // Protection au cas où le nom serait vide
        const nameA = a.name || '';
        const nameB = b.name || '';

        if (this.sortKey() === 'name-desc') {
            return nameB.localeCompare(nameA);
        }
        return nameA.localeCompare(nameB);
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

  // Role : Appliquer un filtre de type de reservant.
  // Préconditions : `value` est un type valide ou 'all'.
  // Postconditions : Le signal `typeFilter` est mis a jour.
  setTypeFilter(value: string): void {
    this.typeFilter.set(value as 'all' | ReservantDto['type']);
  }

  // Role : Appliquer le tri sur la liste.
  // Préconditions : `value` est un tri valide.
  // Postconditions : Le signal `sortKey` est mis a jour.
  setSortKey(value: string): void {
    this.sortKey.set(value as 'name-asc' | 'name-desc');
  }

  // Role : Construire un resume des informations de contact.
  // Préconditions : `reservant` est renseigne.
  // Postconditions : Retourne une chaine lisible pour l'affichage.
  contactInfo(reservant: ReservantDto): string {
    const contacts = [reservant.email, reservant.phone_number].filter(Boolean);
    return contacts.length > 0 ? contacts.join(' / ') : 'Contact non renseigné';
  }

  // Role : Appliquer la requete de recherche par nom.
  // Préconditions : `value` est une chaine de caracteres.
  // Postconditions : `searchQuery` est mis a jour.
  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }
}
