import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UserDto, UserRole, USER_ROLES } from '@app/types/user-dto';
import { UploadService, DEFAULT_AVATAR_URL } from '../../../../services/upload.service';

const ROLE_LABELS: Record<UserRole, string> = {
    benevole: 'Bénévole',
    organizer: 'Organisateur',
    'super-organizer': 'Super-organisateur',
    admin: 'Admin',
};

@Component({
    selector: 'app-admin-user-detail-info',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DatePipe],
    templateUrl: './admin-user-detail-info.html',
    styleUrl: './admin-user-detail-info.scss',
})
// Role : Afficher les informations d'un utilisateur cote admin.
// Préconditions : L'input `user` est fourni.
// Postconditions : Les champs et l'avatar sont rendus.
export class AdminUserDetailInfoComponent {
    readonly user = input.required<UserDto>();
    private readonly uploadService = inject(UploadService);

    readonly roleLabels = ROLE_LABELS;

    // Role : Resoudre l'URL d'avatar a afficher.
    // Préconditions : `avatarUrl` peut etre null ou vide.
    // Postconditions : Retourne une URL valide ou l'avatar par defaut.
    getAvatarUrl(avatarUrl: string | null | undefined): string {
        return avatarUrl ? this.uploadService.getAvatarUrl(avatarUrl) : DEFAULT_AVATAR_URL;
    }
}
