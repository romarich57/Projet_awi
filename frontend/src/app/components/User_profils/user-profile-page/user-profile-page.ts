import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { UserDto } from '@app/types/user-dto';
import { UpdateProfilePayload, UserProfileService } from '@services/user-profile.service';
import { DEFAULT_AVATAR_URL, UploadService } from '@services/upload.service';
import { UserProfileActionsComponent } from '../user-profile-actions/user-profile-actions';
import { UserProfileEditComponent } from '../user-profile-edit/user-profile-edit';
import { UserProfileInfoComponent } from '../user-profile-info/user-profile-info';

type ProfileForm = {
  login: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
};

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserProfileInfoComponent,
    UserProfileEditComponent,
    UserProfileActionsComponent,
  ],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.scss',
})
export class UserProfilePageComponent {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(UserProfileService);
  private readonly uploadService = inject(UploadService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly isLoading = this.auth.isLoading;
  readonly authError = this.auth.error;

  readonly isMutating = this.profileService.isMutating;
  readonly mutationMessage = this.profileService.mutationMessage;
  readonly mutationStatus = this.profileService.mutationStatus;
  readonly lastAction = this.profileService.lastAction;

  readonly isUploading = this.uploadService.isUploading;
  readonly uploadError = this.uploadService.uploadError;

  readonly isEditing = signal(false);
  readonly confirmDelete = signal(false);
  readonly hasRequested = signal(false);

  readonly selectedFile = signal<File | null>(null);
  readonly avatarPreview = signal<string>(DEFAULT_AVATAR_URL);
  readonly avatarRemoved = signal(false);

  readonly editForm = new FormGroup<ProfileForm>({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (this.user() || this.hasRequested()) {
        return;
      }
      this.hasRequested.set(true);
      this.auth.whoami();
    });

    effect(() => {
      const user = this.user();
      if (!user || this.isEditing()) {
        return;
      }
      this.resetForm(user);
      this.selectedFile.set(null);
      this.avatarRemoved.set(false);
      this.avatarPreview.set(
        user.avatarUrl ? this.uploadService.getAvatarUrl(user.avatarUrl) : DEFAULT_AVATAR_URL,
      );
    });

    effect(() => {
      if (this.mutationStatus() !== 'success') {
        return;
      }
      const action = this.lastAction();
      if (action === 'update') {
        this.isEditing.set(false);
        this.selectedFile.set(null);
        this.avatarRemoved.set(false);
      }
      if (action === 'delete') {
        this.router.navigate(['/login']);
      }
    });
  }

  toggleEdit() {
    const current = this.user();
    if (!current) {
      return;
    }
    this.isEditing.update((value) => !value);
    if (!this.isEditing()) {
      this.resetForm(current);
      this.selectedFile.set(null);
      this.avatarRemoved.set(false);
      this.avatarPreview.set(
        current.avatarUrl
          ? this.uploadService.getAvatarUrl(current.avatarUrl)
          : DEFAULT_AVATAR_URL,
      );
    }
  }

  cancelEdit() {
    const current = this.user();
    if (!current) {
      return;
    }
    this.isEditing.set(false);
    this.resetForm(current);
    this.selectedFile.set(null);
    this.avatarRemoved.set(false);
    this.uploadService.uploadError.set(null);
    this.avatarPreview.set(
      current.avatarUrl ? this.uploadService.getAvatarUrl(current.avatarUrl) : DEFAULT_AVATAR_URL,
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.uploadService.uploadError.set('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.uploadService.uploadError.set('L\'image ne doit pas dépasser 2 Mo');
      return;
    }

    this.selectedFile.set(file);
    this.avatarRemoved.set(false);
    this.uploadService.uploadError.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.selectedFile.set(null);
    this.avatarRemoved.set(true);
    this.uploadService.uploadError.set(null);
    this.avatarPreview.set(DEFAULT_AVATAR_URL);
  }

  submitEdit() {
    const current = this.user();
    if (!current) {
      return;
    }
    if (this.isMutating() || this.isUploading()) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    const payload: UpdateProfilePayload = {
      login: value.login.trim(),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim() || null,
    };

    if (this.avatarRemoved()) {
      payload.avatarUrl = null;
    }

    const file = this.selectedFile();
    if (file) {
      this.uploadService.uploadAvatar(file).subscribe((url) => {
        if (!url) {
          return;
        }
        this.profileService.updateProfile({ ...payload, avatarUrl: url });
      });
      return;
    }

    this.profileService.updateProfile(payload);
  }

  requestPasswordReset() {
    const email = this.user()?.email;
    if (!email) {
      return;
    }
    this.profileService.requestPasswordReset(email);
  }

  requestDelete() {
    this.confirmDelete.set(true);
  }

  cancelDelete() {
    this.confirmDelete.set(false);
  }

  confirmDeleteAccount() {
    this.profileService.deleteAccount();
  }

  private resetForm(user: UserDto) {
    this.editForm.reset({
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
    });
  }
}
