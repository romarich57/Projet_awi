import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserDto, UserRole } from '@app/types/user-dto';
import { DEFAULT_AVATAR_URL, UploadService } from '@services/upload.service';

const ROLE_LABELS: Record<UserRole, string> = {
  benevole: 'Bénévole',
  organizer: 'Organisateur',
  'super-organizer': 'Super-organisateur',
  admin: 'Admin',
};

@Component({
  selector: 'app-user-profile-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './user-profile-info.html',
  styleUrl: './user-profile-info.scss',
})
export class UserProfileInfoComponent {
  readonly user = input.required<UserDto>();
  private readonly uploadService = inject(UploadService);

  readonly roleLabels = ROLE_LABELS;

  getAvatarUrl(avatarUrl: string | null | undefined): string {
    return avatarUrl ? this.uploadService.getAvatarUrl(avatarUrl) : DEFAULT_AVATAR_URL;
  }
}
