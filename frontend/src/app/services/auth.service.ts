import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  AuthLoginResponse,
  EmailPayload,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  VerifyEmailResponse,
} from '@app/types/auth-api';
import { UserDto } from '@app/types/user-dto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // --- État interne (signaux) ---
  private readonly _currentUser = signal<UserDto | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // --- État exposé (readonly, computed) ---
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() != null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isOrganizer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'organizer' || role === 'super-organizer' || role === 'admin';
  });
  readonly isSuperOrganizer = computed(() => this.currentUser()?.role === 'super-organizer' || this.isAdmin());

  // --- Connexion ---
  // Role : Connecter un utilisateur avec identifiant et mot de passe.
  // Preconditions : identifier et password sont fournis.
  // Postconditions : Met a jour currentUser, error et isLoading.
  login(identifier: string, password: string) {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .post<AuthLoginResponse>(
        `${environment.apiUrl}/auth/login`,
        { identifier, password },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          if (res?.user) {
            this._currentUser.set(res.user);
          } else {
            this._error.set('Identifiants invalides');
            this._currentUser.set(null);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          this._error.set(this.getServerErrorMessage(err));
          this._currentUser.set(null);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  // --- Déconnexion ---
  // Role : Deconnecter l'utilisateur courant.
  // Preconditions : Aucune.
  // Postconditions : Efface currentUser et redirige vers /login.
  logout() {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._currentUser.set(null);
          this.redirectToLogin();
        }),
        catchError((err) => {
          this._error.set('Erreur de déconnexion');
          this._currentUser.set(null);
          this.redirectToLogin();
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  // --- Vérifie la session actuelle (cookie httpOnly) ---
  // Role : Declencher une verification de session.
  // Preconditions : Aucune.
  // Postconditions : Lance checkSession$ et met a jour l'etat.
  whoami() {
    this.checkSession$().subscribe();
  }

  // Role : Verifier la session en cours via l'API.
  // Preconditions : Aucune.
  // Postconditions : Retourne un Observable de l'utilisateur courant ou null.
  checkSession$() {
    return this.http
      .get<AuthLoginResponse>(`${environment.apiUrl}/auth/whoami`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this._currentUser.set(res?.user ?? null);
        }),
        map((res) => res?.user ?? null),
        catchError((err: HttpErrorResponse) => {
          this._currentUser.set(null);

          if (err.status === 401) {
            return of(null);
          }

          if (err.status === 0) {
            this._error.set('Serveur injoignable (vérifiez HTTPS ou CORS)');
          } else {
            this._error.set(`Erreur serveur (${err.status})`);
          }

          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      );
  }

  // --- Rafraîchissement pour l'interceptor ---
  // Role : Rafraichir les tokens pour l'interceptor.
  // Preconditions : Aucune.
  // Postconditions : Retourne un Observable qui emet null en cas d'erreur.
  refresh$() {
    // observable qui émet null en cas d'erreur
    return this.http
      .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)));
  }

  // Role : Enregistrer un nouvel utilisateur.
  // Preconditions : payload est valide.
  // Postconditions : Retourne un Observable avec le message de resultat.
  register(payload: RegisterPayload) {
    return this.http
      .post<RegisterResponse>(`${environment.apiUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.message),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.getServerErrorMessage(err))),
        ),
      );
  }

  // Role : Verifier l'email via un token.
  // Preconditions : token est fourni.
  // Postconditions : Retourne un Observable de la reponse de verification.
  verifyEmail(token: string) {
    return this.http
      .get<VerifyEmailResponse>(`${environment.apiUrl}/auth/verify-email`, {
        params: { token },
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.getServerErrorMessage(err))),
        ),
      );
  }

  // Role : Renvoyer l'email de verification.
  // Preconditions : email est valide.
  // Postconditions : Retourne un Observable avec le message de resultat.
  resendVerificationEmail(email: string) {
    return this.http
      .post<MessageResponse>(
        `${environment.apiUrl}/auth/resend-verification`,
        { email } satisfies EmailPayload,
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.message),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.getServerErrorMessage(err))),
        ),
      );
  }

  // Role : Demander une reinitialisation de mot de passe.
  // Preconditions : email est valide.
  // Postconditions : Retourne un Observable avec le message de resultat.
  requestPasswordReset(email: string) {
    return this.http
      .post<MessageResponse>(
        `${environment.apiUrl}/auth/password/forgot`,
        { email } satisfies EmailPayload,
        { withCredentials: true },
      )
      .pipe(
        map((res) => res.message),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.getServerErrorMessage(err))),
        ),
      );
  }

  // Role : Reinitialiser le mot de passe.
  // Preconditions : payload est valide.
  // Postconditions : Retourne un Observable avec le message de resultat.
  resetPassword(payload: ResetPasswordPayload) {
    return this.http
      .post<MessageResponse>(`${environment.apiUrl}/auth/password/reset`, payload, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.message),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.getServerErrorMessage(err))),
        ),
      );
  }

  // Role : Normaliser un message d'erreur serveur.
  // Preconditions : err est un HttpErrorResponse.
  // Postconditions : Retourne un message exploitable pour l'UI.
  private getServerErrorMessage(err: HttpErrorResponse) {
    if (err.status === 0) {
      return 'Serveur injoignable (vérifiez HTTPS ou CORS)';
    }

    if (typeof err.error === 'string' && err.error.trim().length > 0) {
      return err.error;
    }

    if (typeof err.error === 'object' && err.error?.error) {
      return err.error.error;
    }

    return `Erreur serveur (${err.status})`;
  }

  // Role : Rediriger vers la page de connexion si necessaire.
  // Preconditions : Aucune.
  // Postconditions : Navigue vers /login si l'URL courante est differente.
  private redirectToLogin() {
    if (this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }
}
