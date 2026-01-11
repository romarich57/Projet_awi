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
import { UpdateUserPayload, UserService } from '@users/user.service';
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

    // Avatar file handling
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

    getAvatarUrl(avatarUrl: string | null | undefined): string {
        return this.uploadService.getAvatarUrl(avatarUrl);
    }

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

    removeAvatar() {
        this.selectedFile.set(null);
        const user = this.user();
        this.avatarPreview.set(user?.avatarUrl ? this.getAvatarUrl(user.avatarUrl) : DEFAULT_AVATAR_URL);
        this.uploadedAvatarUrl.set(null);
    }

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
                this.uploadedAvatarUrl.set(url);
                this.doUpdateUser(selected.id, url);
            });
        } else {
            // Keep current avatarUrl if no new file selected
            this.doUpdateUser(selected.id, selected.avatarUrl ?? null);
        }
    }

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

    goBack() {
        if (history.length > 1) {
            this.location.back();
            return;
        }
        this.router.navigate(['/admin']);
    }

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
