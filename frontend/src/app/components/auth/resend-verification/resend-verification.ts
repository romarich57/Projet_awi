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

@Component({
  selector: 'app-resend-verification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './resend-verification.html',
  styleUrl: './resend-verification.scss',
})
export class ResendVerificationComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal<string | null>(null);

  submit() {
    if (this.form.invalid || this.status() === 'loading') {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('loading');
    this.message.set(null);

    const { email } = this.form.getRawValue();
    this.auth.resendVerificationEmail(email).subscribe({
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
}
