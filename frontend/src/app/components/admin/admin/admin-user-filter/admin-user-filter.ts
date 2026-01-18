import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    input,
    Output,
} from '@angular/core';
import { UserRole, USER_ROLES } from '@app/types/user-dto';

export type SortKey = 'createdAt' | 'login' | 'lastName' | 'role';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'verified' | 'unverified';
export type RoleFilter = UserRole | 'all';

const ROLE_LABELS: Record<UserRole, string> = {
    benevole: 'Bénévole',
    organizer: 'Organisateur',
    'super-organizer': 'Super-organisateur',
    admin: 'Admin',
};

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: 'createdAt', label: 'Date de creation' },
    { value: 'login', label: 'Identifiant' },
    { value: 'lastName', label: 'Nom' },
    { value: 'role', label: 'Role' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'verified', label: 'Email verifie' },
    { value: 'unverified', label: 'Email non verifie' },
];

@Component({
    selector: 'app-admin-user-filter',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './admin-user-filter.html',
    styleUrl: './admin-user-filter.scss',
})
// Role : Afficher les filtres et tris pour la liste d'utilisateurs admin.
// Préconditions : Les valeurs de filtres sont fournies par le parent.
// Postconditions : Les changements de filtres/tri sont emis.
export class AdminUserFilterComponent {
    // Inputs
    readonly searchQuery = input<string>('');
    readonly roleFilter = input<RoleFilter>('all');
    readonly statusFilter = input<StatusFilter>('all');
    readonly sortKey = input<SortKey>('createdAt');
    readonly sortDirection = input<SortDirection>('desc');

    // Outputs
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() roleFilterChange = new EventEmitter<RoleFilter>();
    @Output() statusFilterChange = new EventEmitter<StatusFilter>();
    @Output() sortKeyChange = new EventEmitter<SortKey>();
    @Output() sortDirectionChange = new EventEmitter<SortDirection>();
    @Output() resetFiltersEvent = new EventEmitter<void>();

    // Constants exposed to template
    readonly roleOptions = USER_ROLES;
    readonly roleLabels = ROLE_LABELS;
    readonly sortOptions = SORT_OPTIONS;
    readonly statusOptions = STATUS_OPTIONS;

    // Role : Mettre a jour la recherche texte.
    // Préconditions : L'evenement provient d'un input texte.
    // Postconditions : `searchQueryChange` est emis.
    updateSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchQueryChange.emit(value);
    }

    // Role : Mettre a jour le filtre de role.
    // Préconditions : L'evenement provient d'un select role.
    // Postconditions : `roleFilterChange` est emis.
    updateRoleFilter(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.roleFilterChange.emit(value === 'all' ? 'all' : (value as UserRole));
    }

    // Role : Mettre a jour le filtre de statut.
    // Préconditions : L'evenement provient d'un select statut.
    // Postconditions : `statusFilterChange` est emis.
    updateStatusFilter(event: Event) {
        const value = (event.target as HTMLSelectElement).value as StatusFilter;
        this.statusFilterChange.emit(value);
    }

    // Role : Mettre a jour la cle de tri.
    // Préconditions : L'evenement provient d'un select tri.
    // Postconditions : `sortKeyChange` est emis.
    updateSortKey(event: Event) {
        const value = (event.target as HTMLSelectElement).value as SortKey;
        this.sortKeyChange.emit(value);
    }

    // Role : Inverser la direction de tri.
    // Préconditions : La direction actuelle est connue.
    // Postconditions : `sortDirectionChange` est emis avec la nouvelle direction.
    toggleSortDirection() {
        const newDirection = this.sortDirection() === 'asc' ? 'desc' : 'asc';
        this.sortDirectionChange.emit(newDirection);
    }

    // Role : Reinitialiser tous les filtres.
    // Préconditions : Le parent ecoute l'evenement.
    // Postconditions : `resetFiltersEvent` est emis.
    resetFilters() {
        this.resetFiltersEvent.emit();
    }
}
