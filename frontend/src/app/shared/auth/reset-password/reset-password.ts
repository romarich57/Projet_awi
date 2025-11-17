import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@auth/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly token = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      password: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: this.fb.control('', {
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatchValidator },
  );

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal<string | null>(null);
  readonly hasToken = computed(() => !!this.token());

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.token.set(token);
    } else {
      this.status.set('error');
      this.message.set('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
    }
  }

  get passwordsMismatch() {
    return this.form.hasError('mismatch') && this.form.controls.confirmPassword.touched;
  }

  submit() {
    if (this.form.invalid || this.status() === 'loading') {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.token();
    if (!token) {
      this.status.set('error');
      this.message.set('Lien invalide ou expiré. Demandez un nouveau lien.');
      return;
    }

    this.status.set('loading');
    this.message.set(null);

    const { password } = this.form.getRawValue();
    this.auth.resetPassword({ token, password }).subscribe({
      next: (msg) => {
        this.status.set('success');
        this.message.set(msg);
      },
      error: (err: Error) => {
        this.status.set('error');
        this.message.set(err.message);
      },
    });
  }

  resetForm() {
    this.form.reset();
    this.status.set(this.hasToken() ? 'idle' : 'error');
    this.message.set(this.hasToken() ? null : 'Lien invalide ou expiré. Demandez un nouveau lien.');
  }
}
