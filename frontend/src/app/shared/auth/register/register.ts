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
import { AuthService } from '@auth/auth.service';
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
    avatarUrl: this.fb.control(''),
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  submit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

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
        avatarUrl: payload.avatarUrl?.trim() || undefined,
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
            avatarUrl: '',
          });
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
        },
      });
  }
}
