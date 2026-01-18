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
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
// Role : Gerer l'inscription d'un utilisateur.
// Préconditions : AuthService est disponible.
// Postconditions : L'inscription est envoyee et l'UI est mise a jour.
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
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Role : Soumettre le formulaire d'inscription.
  // Préconditions : Le formulaire est valide et aucune soumission en cours.
  // Postconditions : L'inscription est lancee.
  submit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.doRegister();
  }

  // Role : Construire la charge utile et appeler l'API d'inscription.
  // Préconditions : Les champs du formulaire sont renseignes.
  // Postconditions : L'inscription est envoyee et l'etat est mis a jour.
  private doRegister() {
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
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
        },
      });
  }
}
