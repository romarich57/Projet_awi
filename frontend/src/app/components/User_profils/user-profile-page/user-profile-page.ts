import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
// Role : Afficher et gerer la page de profil utilisateur (lecture, edition, suppression).
// Préconditions : L'utilisateur est charge via AuthService; les services de profil et upload sont disponibles.
// Postconditions : Les actions utilisateur declenchent les mises a jour ou la suppression du profil.
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
  readonly canDeleteAccount = computed(() => {
    const current = this.user();
    if (!current) {
      return false;
    }
    return !this.isProtectedAdmin(current);
  });

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

  // Role : Basculer le mode edition et reinitialiser les champs si besoin.
  // Préconditions : Un utilisateur est charge.
  // Postconditions : Le formulaire et l'aperçu d'avatar sont remis en etat.
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

  // Role : Annuler l'edition et restaurer les donnees d'origine.
  // Préconditions : Un utilisateur est charge.
  // Postconditions : Le formulaire retrouve les valeurs initiales et les erreurs sont reinitialisees.
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

  // Role : Gerer la selection d'un fichier avatar.
  // Préconditions : L'evenement provient d'un input file.
  // Postconditions : Le fichier est valide, stocke et previsualise si possible.
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

  // Role : Indiquer que l'avatar doit etre supprime.
  // Préconditions : Le formulaire d'edition est actif ou le profil charge.
  // Postconditions : L'avatar est marque comme supprime et l'aperçu revient par defaut.
  removeAvatar() {
    this.selectedFile.set(null);
    this.avatarRemoved.set(true);
    this.uploadService.uploadError.set(null);
    this.avatarPreview.set(DEFAULT_AVATAR_URL);
  }

  // Role : Soumettre les modifications de profil.
  // Préconditions : Un utilisateur est charge et le formulaire est valide.
  // Postconditions : Le profil est mis a jour, avec ou sans upload d'avatar.
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

  // Role : Demander un reset de mot de passe pour l'utilisateur courant.
  // Préconditions : L'email utilisateur est disponible.
  // Postconditions : Une demande de reinitialisation est envoyee.
  requestPasswordReset() {
    const email = this.user()?.email;
    if (!email) {
      return;
    }
    this.profileService.requestPasswordReset(email);
  }

  // Role : Ouvrir la confirmation de suppression de compte.
  // Préconditions : Le profil est charge.
  // Postconditions : L'indicateur de confirmation est active.
  requestDelete() {
    if (!this.canDeleteAccount()) {
      return;
    }
    this.confirmDelete.set(true);
  }

  // Role : Fermer la confirmation de suppression de compte.
  // Préconditions : La confirmation est ouverte.
  // Postconditions : L'indicateur de confirmation est desactive.
  cancelDelete() {
    this.confirmDelete.set(false);
  }

  // Role : Declencher la suppression du compte.
  // Préconditions : L'utilisateur confirme la suppression.
  // Postconditions : Le service de profil envoie la demande de suppression.
  confirmDeleteAccount() {
    if (!this.canDeleteAccount()) {
      return;
    }
    this.profileService.deleteAccount();
  }

  // Role : Reinitialiser le formulaire avec les donnees utilisateur.
  // Préconditions : `user` contient les champs requis.
  // Postconditions : Le formulaire est aligne avec les donnees du profil.
  private resetForm(user: UserDto) {
    this.editForm.reset({
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
    });
  }

  // Role : Verifier si l'utilisateur correspond au compte admin initial.
  // Préconditions : user contient les champs login/email.
  // Postconditions : Retourne true si l'utilisateur est protege.
  private isProtectedAdmin(user: UserDto): boolean {
    const login = user.login?.toLowerCase() ?? '';
    const email = user.email?.toLowerCase() ?? '';
    return login === 'admin' || email === 'admin@secureapp.com';
  }
}
