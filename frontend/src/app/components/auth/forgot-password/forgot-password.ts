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
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
// Role : Demander un lien de reinitialisation de mot de passe.
// Préconditions : L'utilisateur fournit une adresse email valide.
// Postconditions : La demande est envoyee et l'etat UI est mis a jour.
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal<string | null>(null);

  // Role : Soumettre la demande de reinitialisation.
  // Préconditions : Le formulaire est valide et aucune requete en cours.
  // Postconditions : La demande est envoyee via AuthService.
  submit() {
    if (this.form.invalid || this.status() === 'loading') {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('loading');
    this.message.set(null);

    const { email } = this.form.getRawValue();
    this.auth.requestPasswordReset(email).subscribe({
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
