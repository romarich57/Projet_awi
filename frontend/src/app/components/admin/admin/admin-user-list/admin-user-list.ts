import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserDto, UserRole } from '@app/types/user-dto';
import { UserService } from '@services/user.service';
import { AdminUserFilterComponent, SortKey, SortDirection, StatusFilter, RoleFilter } from '../admin-user-filter/admin-user-filter';
import { AdminUserCrudComponent } from '../admin-user-crud/admin-user-crud';

@Component({
    selector: 'app-admin-user-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterLink, AdminUserFilterComponent, AdminUserCrudComponent],
    templateUrl: './admin-user-list.html',
    styleUrl: './admin-user-list.scss',
})
// Role : Afficher et filtrer la liste des utilisateurs cote admin.
// Préconditions : UserService est disponible et renvoie les utilisateurs.
// Postconditions : Les actions de tri/filtre/mise a jour sont gerees.
export class AdminUserListComponent {
    readonly userService = inject(UserService);

    readonly users = this.userService.users;
    readonly isLoading = this.userService.isLoading;
    readonly error = this.userService.error;
    readonly isMutating = this.userService.isMutating;
    readonly mutationMessage = this.userService.mutationMessage;
    readonly mutationStatus = this.userService.mutationStatus;

    readonly searchQuery = signal('');
    readonly roleFilter = signal<RoleFilter>('all');
    readonly statusFilter = signal<StatusFilter>('all');
    readonly sortKey = signal<SortKey>('createdAt');
    readonly sortDirection = signal<SortDirection>('desc');

    readonly pendingRoles = signal<Record<number, UserRole>>({});

    readonly filteredUsers = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const role = this.roleFilter();
        const status = this.statusFilter();
        const sortKey = this.sortKey();
        const sortDirection = this.sortDirection();

        let list = this.users();

        if (role !== 'all') {
            list = list.filter((user) => user.role === role);
        }

        if (status !== 'all') {
            const shouldBeVerified = status === 'verified';
            list = list.filter((user) => user.emailVerified === shouldBeVerified);
        }

        if (query) {
            list = list.filter((user) => {
                const haystack = `${user.login} ${user.firstName} ${user.lastName} ${user.email}`
                    .toLowerCase();
                return haystack.includes(query);
            });
        }

        const sorted = [...list].sort((a, b) => {
            let compare = 0;
            switch (sortKey) {
                case 'login':
                    compare = a.login.localeCompare(b.login, 'fr', { sensitivity: 'base' });
                    break;
                case 'lastName':
                    compare = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
                    break;
                case 'role':
                    compare = a.role.localeCompare(b.role, 'fr', { sensitivity: 'base' });
                    break;
                case 'createdAt':
                default:
                    compare =
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
            }

            return sortDirection === 'asc' ? compare : compare * -1;
        });

        return sorted;
    });

    readonly totalUsers = computed(() => this.users().length);
    readonly verifiedUsers = computed(() => this.users().filter((u) => u.emailVerified).length);
    readonly adminUsers = computed(() => this.users().filter((u) => u.role === 'admin').length);

    constructor() {
        effect(() => this.userService.loadAll());
        effect(() => {
            const users = this.users();
            this.pendingRoles.update((current) => {
                let changed = false;
                const next = { ...current };
                for (const user of users) {
                    if (next[user.id] && next[user.id] === user.role) {
                        delete next[user.id];
                        changed = true;
                    }
                }
                return changed ? next : current;
            });
        });
        effect(() => {
            if (this.mutationStatus() === 'error') {
                this.pendingRoles.set({});
            }
        });
    }

    // Role : Mettre a jour la recherche texte.
    // Préconditions : `query` est une chaine.
    // Postconditions : Le filtre de recherche est mis a jour.
    onSearchQueryChange(query: string) {
        this.searchQuery.set(query);
    }

    // Role : Mettre a jour le filtre de role.
    // Préconditions : `role` est un role valide ou 'all'.
    // Postconditions : Le filtre de role est mis a jour.
    onRoleFilterChange(role: RoleFilter) {
        this.roleFilter.set(role);
    }

    // Role : Mettre a jour le filtre de statut.
    // Préconditions : `status` est un statut valide.
    // Postconditions : Le filtre de statut est mis a jour.
    onStatusFilterChange(status: StatusFilter) {
        this.statusFilter.set(status);
    }

    // Role : Mettre a jour la cle de tri.
    // Préconditions : `key` est une cle valide.
    // Postconditions : Le tri est mis a jour.
    onSortKeyChange(key: SortKey) {
        this.sortKey.set(key);
    }

    // Role : Mettre a jour la direction de tri.
    // Préconditions : `direction` est valide.
    // Postconditions : La direction de tri est mise a jour.
    onSortDirectionChange(direction: SortDirection) {
        this.sortDirection.set(direction);
    }

    // Role : Reinitialiser tous les filtres et tris.
    // Préconditions : Aucune.
    // Postconditions : Les filtres reviennent aux valeurs par defaut.
    onResetFilters() {
        this.searchQuery.set('');
        this.roleFilter.set('all');
        this.statusFilter.set('all');
        this.sortKey.set('createdAt');
        this.sortDirection.set('desc');
    }

    // CRUD event handlers
    // Role : Demander un changement de role utilisateur.
    // Préconditions : Aucune mutation en cours.
    // Postconditions : Le role est mis a jour via UserService.
    onRoleChanged(event: { user: UserDto; role: UserRole }) {
        if (this.isMutating()) {
            return;
        }
        this.pendingRoles.update((current) => ({ ...current, [event.user.id]: event.role }));
        this.userService.updateUser(event.user.id, { role: event.role });
    }

    // Role : Demander la suppression d'un utilisateur.
    // Préconditions : L'id est valide et aucune mutation en cours.
    // Postconditions : La suppression est envoyee via UserService.
    onUserDeleted(event: { id: number; event?: Event }) {
        event.event?.stopPropagation();
        if (!Number.isInteger(event.id)) {
            return;
        }
        if (this.isMutating()) {
            return;
        }
        this.userService.deleteUser(event.id);
    }
}
