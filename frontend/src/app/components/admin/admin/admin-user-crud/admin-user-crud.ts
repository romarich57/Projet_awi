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
import { UserService } from '@users/user.service';

const ROLE_LABELS: Record<UserRole, string> = {
    visiteur: 'Visiteur',
    benevole: 'Benevole',
    organizer: 'Organisateur',
    'super-organizer': 'Super-organisateur',
    admin: 'Admin',
};

@Component({
    selector: 'app-admin-user-crud',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './admin-user-crud.html',
    styleUrl: './admin-user-crud.scss',
})
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

    displayRole(): UserRole {
        const user = this.user();
        return this.pendingRoles()[user.id] ?? user.role;
    }

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
        if (role === user.role) {
            return;
        }
        this.roleChanged.emit({ user, role });
    }

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
}
