import { CommonModule, Location } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { UserDto, UserRole } from '@app/types/user-dto';
import { UpdateUserPayload, UserService } from '@services/user.service';
import { UploadService, DEFAULT_AVATAR_URL } from '../../../../services/upload.service';
import { AdminUserDetailInfoComponent } from '../admin-user-detail-info/admin-user-detail-info';
import { AdminUserDetailEditComponent } from '../admin-user-detail-edit/admin-user-detail-edit';

type EditUserForm = {
    login: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    role: FormControl<UserRole>;
    emailVerified: FormControl<boolean>;
};

@Component({
    selector: 'app-admin-user-detail-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, AdminUserDetailInfoComponent, AdminUserDetailEditComponent],
    templateUrl: './admin-user-detail-page.html',
    styleUrl: './admin-user-detail-page.scss',
})
// Role : Afficher et editer le detail d'un utilisateur cote admin.
// Préconditions : L'id utilisateur est present dans la route; UserService est disponible.
// Postconditions : Les donnees sont chargees et les actions admin sont gerees.
export class AdminUserDetailPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly location = inject(Location);

    readonly userService = inject(UserService);
    readonly uploadService = inject(UploadService);
    readonly users = this.userService.users;
    readonly isLoading = this.userService.isLoading;
    readonly error = this.userService.error;
    readonly isMutating = this.userService.isMutating;
    readonly mutationMessage = this.userService.mutationMessage;
    readonly mutationStatus = this.userService.mutationStatus;
    readonly isUploading = this.uploadService.isUploading;
    readonly uploadError = this.uploadService.uploadError;

    readonly isEditing = signal(false);
    readonly lastMutation = signal<'update' | null>(null);
    readonly hasRequested = signal(false);

    
    readonly selectedFile = signal<File | null>(null);
    readonly avatarPreview = signal<string>(DEFAULT_AVATAR_URL);
    readonly uploadedAvatarUrl = signal<string | null>(null);

    readonly routeUserId = toSignal(
        this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
        { initialValue: Number.NaN },
    );

    readonly hasValidId = computed(() => {
        const id = this.routeUserId();
        return Number.isInteger(id) && id > 0;
    });

    readonly user = computed(() => {
        if (!this.hasValidId()) {
            return null;
        }
        const id = this.routeUserId();
        return this.users().find((item) => item.id === id) ?? null;
    });

    readonly isProtectedAdmin = computed(() => {
        const user = this.user();
        if (!user) {
            return false;
        }
        return (
            user.id === 1 ||
            user.login === 'admin' ||
            user.email.toLowerCase() === 'admin@secureapp.com'
        );
    });

    readonly showNotFound = computed(() => {
        return this.hasValidId() && !this.isLoading() && !this.user();
    });

    readonly editForm = new FormGroup<EditUserForm>({
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
        role: new FormControl<UserRole>('benevole', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        emailVerified: new FormControl(false, { nonNullable: true }),
    });

    constructor() {
        effect(() => {
            const shouldLoad = this.hasValidId();
            if (shouldLoad && !this.hasRequested() && this.users().length === 0) {
                this.hasRequested.set(true);
                this.userService.loadAll();
            }
        });

        effect(() => {
            const user = this.user();
            if (!user) {
                return;
            }
            this.resetEditForm(user);
            this.isEditing.set(false);
        });

        effect(() => {
            if (this.isProtectedAdmin()) {
                this.editForm.controls.role.disable({ emitEvent: false });
                return;
            }
            this.editForm.controls.role.enable({ emitEvent: false });
        });

        effect(() => {
            const status = this.mutationStatus();
            const action = this.lastMutation();
            if (status === 'success' && action === 'update') {
                this.isEditing.set(false);
                this.selectedFile.set(null);
                this.uploadedAvatarUrl.set(null);
            }
            if (status && action) {
                this.lastMutation.set(null);
            }
        });
    }

    // Role : Resoudre l'URL d'avatar pour l'affichage.
    // Préconditions : `avatarUrl` peut etre null.
    // Postconditions : Retourne une URL complete.
    getAvatarUrl(avatarUrl: string | null | undefined): string {
        return this.uploadService.getAvatarUrl(avatarUrl);
    }

    // Role : Gerer la selection d'un fichier avatar.
    // Préconditions : L'evenement provient d'un input file.
    // Postconditions : Le fichier est valide et l'aperçu est mis a jour.
    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.uploadService.uploadError.set('Veuillez sélectionner une image');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            this.uploadService.uploadError.set('L\'image ne doit pas dépasser 2 Mo');
            return;
        }

        this.selectedFile.set(file);
        this.uploadService.uploadError.set(null);

        // Preview
        const reader = new FileReader();
        reader.onload = () => {
            this.avatarPreview.set(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    // Role : Annuler l'avatar selectionne et restaurer l'avatar courant.
    // Préconditions : Un utilisateur est charge.
    // Postconditions : Les signaux d'avatar reviennent a l'etat initial.
    removeAvatar() {
        this.selectedFile.set(null);
        const user = this.user();
        this.avatarPreview.set(user?.avatarUrl ? this.getAvatarUrl(user.avatarUrl) : DEFAULT_AVATAR_URL);
        this.uploadedAvatarUrl.set(null);
    }

    // Role : Basculer le mode edition et restaurer les valeurs si besoin.
    // Préconditions : Un utilisateur est charge.
    // Postconditions : Le formulaire est en mode edition ou lecture.
    toggleEdit() {
        if (!this.user()) {
            return;
        }
        this.isEditing.update((value) => !value);
        const current = this.user();
        if (!this.isEditing() && current) {
            this.resetEditForm(current);
            this.selectedFile.set(null);
            this.avatarPreview.set(current.avatarUrl ? this.getAvatarUrl(current.avatarUrl) : DEFAULT_AVATAR_URL);
        }
    }

    // Role : Annuler l'edition et restaurer le formulaire.
    // Préconditions : Un utilisateur est charge.
    // Postconditions : L'edition est annulee et l'avatar est restaure.
    cancelEdit() {
        const current = this.user();
        if (!current) {
            return;
        }
        this.isEditing.set(false);
        this.resetEditForm(current);
        this.selectedFile.set(null);
        this.avatarPreview.set(current.avatarUrl ? this.getAvatarUrl(current.avatarUrl) : DEFAULT_AVATAR_URL);
    }

    // Role : Soumettre les modifications d'un utilisateur.
    // Préconditions : Le formulaire est valide et l'utilisateur est charge.
    // Postconditions : Les donnees sont envoyees et l'avatar est traite si besoin.
    submitEdit() {
        const selected = this.user();
        if (!selected) {
            return;
        }
        if (this.isMutating() || this.isUploading()) {
            return;
        }
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const file = this.selectedFile();
        if (file) {
            // Upload avatar first, then update user
            this.uploadService.uploadAvatar(file).subscribe((url) => {
                if (!url) {
                    this.doUpdateUser(selected.id, selected.avatarUrl ?? null);
                    return;
                }
                this.uploadedAvatarUrl.set(url);
                this.doUpdateUser(selected.id, url);
            });
            return;
        } else {
            // Keep current avatarUrl if no new file selected
            this.doUpdateUser(selected.id, selected.avatarUrl ?? null);
        }
    }

    // Role : Construire la charge utile et appeler la mise a jour utilisateur.
    // Préconditions : `userId` est valide.
    // Postconditions : Une requete de mise a jour est declenchee.
    private doUpdateUser(userId: number, avatarUrl: string | null) {
        const value = this.editForm.getRawValue();
        const payload: UpdateUserPayload = {
            login: value.login.trim(),
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            email: value.email.trim().toLowerCase(),
            phone: value.phone.trim() || null,
            avatarUrl: avatarUrl,
            role: value.role,
            emailVerified: value.emailVerified,
        };

        this.userService.updateUser(userId, payload);
        this.lastMutation.set('update');
    }

    // Role : Revenir a l'ecran precedent ou a la liste admin.
    // Préconditions : Le routeur ou l'historique est disponible.
    // Postconditions : La navigation retour est effectuee.
    goBack() {
        if (history.length > 1) {
            this.location.back();
            return;
        }
        this.router.navigate(['/admin']);
    }

    // Role : Reinitialiser le formulaire d'edition avec les donnees utilisateur.
    // Préconditions : `user` contient les champs requis.
    // Postconditions : Le formulaire et l'aperçu d'avatar sont synchronises.
    private resetEditForm(user: UserDto) {
        this.editForm.reset({
            login: user.login,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? '',
            role: user.role,
            emailVerified: user.emailVerified,
        });
        this.avatarPreview.set(user.avatarUrl ? this.getAvatarUrl(user.avatarUrl) : DEFAULT_AVATAR_URL);
    }
}
