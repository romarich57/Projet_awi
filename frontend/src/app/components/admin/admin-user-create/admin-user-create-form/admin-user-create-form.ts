import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRole } from '@app/types/user-dto';
import { CreateUserPayload, UserService } from '@users/user.service';
import { UploadService, DEFAULT_AVATAR_URL } from '../../../../services/upload.service';
import { AdminUserCreateCrudComponent } from '../admin-user-create-crud/admin-user-create-crud';

type CreateUserForm = {
    login: FormControl<string>;
    password: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    role: FormControl<UserRole>;
};

@Component({
    selector: 'app-admin-user-create-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, AdminUserCreateCrudComponent],
    templateUrl: './admin-user-create-form.html',
    styleUrl: './admin-user-create-form.scss',
})
export class AdminUserCreateFormComponent {
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    readonly userService = inject(UserService);
    readonly uploadService = inject(UploadService);

    readonly isMutating = this.userService.isMutating;
    readonly mutationMessage = this.userService.mutationMessage;
    readonly mutationStatus = this.userService.mutationStatus;
    readonly isUploading = this.uploadService.isUploading;
    readonly uploadError = this.uploadService.uploadError;

    readonly lastMutation = signal<'create' | null>(null);

    // Avatar file handling
    readonly selectedFile = signal<File | null>(null);
    readonly avatarPreview = signal<string>(DEFAULT_AVATAR_URL);
    readonly uploadedAvatarUrl = signal<string | null>(null);

    readonly createForm = new FormGroup<CreateUserForm>({
        login: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(8)],
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
    });

    constructor() {
        effect(() => {
            const status = this.mutationStatus();
            const action = this.lastMutation();
            if (status === 'success' && action === 'create') {
                this.resetForm();
            }
            if (status && action) {
                this.lastMutation.set(null);
            }
        });
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
        this.avatarPreview.set(DEFAULT_AVATAR_URL);
        this.uploadedAvatarUrl.set(null);
    }

    submit() {
        if (this.isMutating() || this.isUploading()) {
            return;
        }
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const file = this.selectedFile();
        if (file) {
            // Upload avatar first, then create user
            this.uploadService.uploadAvatar(file).subscribe((url) => {
                this.uploadedAvatarUrl.set(url);
                this.createUserWithAvatar(url);
            });
        } else {
            this.createUserWithAvatar(null);
        }
    }

    private createUserWithAvatar(avatarUrl: string | null) {
        const value = this.createForm.getRawValue();
        const payload: CreateUserPayload = {
            login: value.login.trim(),
            password: value.password,
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            email: value.email.trim().toLowerCase(),
            phone: value.phone.trim() || null,
            avatarUrl: avatarUrl,
            role: value.role,
        };

        this.userService.createUser(payload);
        this.lastMutation.set('create');
    }

    goBack() {
        if (history.length > 1) {
            this.location.back();
            return;
        }
        this.router.navigate(['/admin']);
    }

    private resetForm() {
        this.createForm.reset({
            login: '',
            password: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: 'benevole',
        });
        this.selectedFile.set(null);
        this.avatarPreview.set(DEFAULT_AVATAR_URL);
        this.uploadedAvatarUrl.set(null);
    }
}
