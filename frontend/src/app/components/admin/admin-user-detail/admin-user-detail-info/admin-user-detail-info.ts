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
export class AdminUserDetailInfoComponent {
    readonly user = input.required<UserDto>();
    private readonly uploadService = inject(UploadService);

    readonly roleLabels = ROLE_LABELS;

    getAvatarUrl(avatarUrl: string | null | undefined): string {
        return avatarUrl ? this.uploadService.getAvatarUrl(avatarUrl) : DEFAULT_AVATAR_URL;
    }
}
