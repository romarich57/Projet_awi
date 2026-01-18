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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { UserDto } from '@app/types/user-dto';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
// Role : Verifier l'email via un token.
// Préconditions : Un token peut etre fourni dans l'URL ou saisi manuellement.
// Postconditions : Le compte est verifie et l'etat UI est mis a jour.
export class VerifyEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    token: this.fb.control('', { validators: [Validators.required] }),
  });

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal('Collez le token reçu par email ou ouvrez directement le lien.');
  readonly verifiedUser = signal<UserDto | null>(null);
  readonly autoMode = signal(false);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.autoMode.set(true);
      this.form.controls.token.setValue(token);
      queueMicrotask(() => this.submit(true));
    }
  }

  // Role : Soumettre le token de verification.
  // Préconditions : Le formulaire est valide et un token est present.
  // Postconditions : La verification est lancee et l'etat est mis a jour.
  submit(auto = false) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.form.controls.token.getRawValue().trim();
    if (!token) {
      this.status.set('error');
      this.message.set('Token manquant ou invalide.');
      return;
    }

    this.status.set('loading');
    this.message.set(auto ? 'Vérification automatique en cours…' : 'Vérification en cours…');
    this.verifiedUser.set(null);

    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.status.set('success');
        this.message.set(res.message);
        this.verifiedUser.set(res.user);
        this.autoMode.set(false);
        this.clearTokenFromUrl();
      },
      error: (err: Error) => {
        this.status.set('error');
        this.message.set(err.message);
        this.autoMode.set(false);
      },
    });
  }

  // Role : Reinitialiser l'etat pour une nouvelle tentative.
  // Préconditions : Aucune.
  // Postconditions : Le formulaire et les messages reviennent a l'etat initial.
  retry() {
    this.status.set('idle');
    this.message.set('Collez le token reçu par email ou ouvrez directement le lien.');
    this.autoMode.set(false);
    this.form.reset();
  }

  // Role : Nettoyer le token dans l'URL apres verification.
  // Préconditions : Le routeur est disponible.
  // Postconditions : Les query params sont supprimes.
  private clearTokenFromUrl() {
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true,
    });
  }
}
