import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { UploadService, DEFAULT_AVATAR_URL } from '../../../services/upload.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  readonly uploadService = inject(UploadService);

  readonly form = this.fb.group({
    login: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    firstName: this.fb.control('', {
      validators: [Validators.required],
    }),
    lastName: this.fb.control('', {
      validators: [Validators.required],
    }),
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
    }),
    password: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(8)],
    }),
    phone: this.fb.control(''),
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Avatar file handling
  readonly selectedFile = signal<File | null>(null);
  readonly avatarPreview = signal<string>(DEFAULT_AVATAR_URL);
  readonly uploadedAvatarUrl = signal<string | null>(null);
  readonly isUploading = this.uploadService.isUploading;
  readonly uploadError = this.uploadService.uploadError;

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
    if (this.form.invalid || this.isSubmitting() || this.isUploading()) {
      this.form.markAllAsTouched();
      return;
    }

    const file = this.selectedFile();
    if (file) {
      // Upload avatar first, then register
      this.uploadService.uploadAvatar(file).subscribe((url) => {
        this.uploadedAvatarUrl.set(url);
        this.doRegister(url);
      });
    } else {
      this.doRegister(null);
    }
  }

  private doRegister(avatarUrl: string | null) {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = this.form.getRawValue();

    this.auth
      .register({
        login: payload.login.trim(),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        password: payload.password,
        phone: payload.phone?.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (message) => {
          this.successMessage.set(message);
          this.form.reset({
            login: '',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
          });
          this.selectedFile.set(null);
          this.avatarPreview.set(DEFAULT_AVATAR_URL);
          this.uploadedAvatarUrl.set(null);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
        },
      });
  }
}
