import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    input,
    Output,
    signal,
} from '@angular/core';
import { UserDto, UserRole, USER_ROLES } from '@app/types/user-dto';
import { UserService } from '@services/user.service';

const ROLE_LABELS: Record<UserRole, string> = {
    benevole: 'Bénévole',
    organizer: 'Organisateur',
    'super-organizer': 'Super-organisateur',
    admin: 'Admin',
};
const PROTECTED_ADMIN_ID = 1;
const PROTECTED_ADMIN_LOGIN = 'admin';
const PROTECTED_ADMIN_EMAIL = 'admin@secureapp.com';

@Component({
    selector: 'app-admin-user-crud',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './admin-user-crud.html',
    styleUrl: './admin-user-crud.scss',
})
// Role : Afficher une ligne utilisateur avec actions admin (role/suppression).
// Préconditions : `user` est fourni et le parent gere l'etat de mutation.
// Postconditions : Les actions sont emises vers le parent.
export class AdminUserCrudComponent {
    private readonly userService = inject(UserService);

    // Input: the user to display actions for
    readonly user = input.required<UserDto>();

    // State from parent
    readonly isMutating = input<boolean>(false);
    readonly pendingRoles = input<Record<number, UserRole>>({});

    // Outputs
    @Output() roleChanged = new EventEmitter<{ user: UserDto; role: UserRole }>();
    @Output() userDeleted = new EventEmitter<{ id: number; event?: Event }>();

    // Constants exposed to template
    readonly roleOptions = USER_ROLES;
    readonly roleLabels = ROLE_LABELS;

    // Role : Afficher le role courant (ou en attente) de l'utilisateur.
    // Préconditions : `pendingRoles` peut contenir un role temporaire.
    // Postconditions : Retourne le role a afficher.
    displayRole(): UserRole {
        const user = this.user();
        return this.pendingRoles()[user.id] ?? user.role;
    }

    // Role : Emmettre un changement de role utilisateur.
    // Préconditions : Aucune mutation en cours et un role valide est selectionne.
    // Postconditions : `roleChanged` est emis avec l'utilisateur et le nouveau role.
    updateUserRole(event: Event) {
        if (this.isMutating()) {
            return;
        }
        const target = event.target as HTMLSelectElement | null;
        const role = target?.value as UserRole | undefined;
        if (!role) {
            return;
        }
        const user = this.user();
        if (this.isProtectedAdmin(user)) {
            return;
        }
        if (role === user.role) {
            return;
        }
        this.roleChanged.emit({ user, role });
    }

    // Role : Emmettre la demande de suppression d'un utilisateur.
    // Préconditions : Aucune mutation en cours et l'id utilisateur est valide.
    // Postconditions : `userDeleted` est emis.
    deleteUser(event?: Event) {
        event?.stopPropagation();
        const user = this.user();
        if (!Number.isInteger(user.id)) {
            return;
        }
        if (this.isMutating()) {
            return;
        }
        this.userDeleted.emit({ id: user.id, event });
    }

    isProtectedAdmin(user: UserDto): boolean {
        return (
            user.id === PROTECTED_ADMIN_ID ||
            user.login === PROTECTED_ADMIN_LOGIN ||
            user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL
        );
    }
}
