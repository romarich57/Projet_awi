import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
// Role : Gerer la connexion utilisateur.
// Préconditions : AuthService est disponible.
// Postconditions : L'utilisateur est authentifie et redirige si deja connecte.
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    identifier: this.fb.control('', {
      validators: [Validators.required],
    }),
    password: this.fb.control('', {
      validators: [Validators.required],
    }),
  });

  readonly isLoading = this.auth.isLoading;
  readonly error = this.auth.error;

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.router.navigateByUrl('/home');
      }
    });
  }

  // Role : Soumettre les identifiants de connexion.
  // Préconditions : Le formulaire est valide et aucune connexion en cours.
  // Postconditions : La demande de connexion est envoyee via AuthService.
  submit() {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.form.getRawValue();
    this.auth.login(identifier, password);
  }
}
