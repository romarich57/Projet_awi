import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { UserDto, UserRole } from '@app/types/user-dto';
import { catchError, finalize, of, tap } from 'rxjs';

export type CreateUserPayload = {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
};

export type UpdateUserPayload = {
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  emailVerified?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly _users = signal<UserDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isMutating = signal(false);
  readonly mutationMessage = signal<string | null>(null);
  readonly mutationStatus = signal<'success' | 'error' | null>(null);

  loadAll() {
    this._isLoading.set(true);
    this._error.set(null);

    this.http
      .get<UserDto[]>(`${environment.apiUrl}/users`, { withCredentials: true })
      .pipe(
        tap((users) => this._users.set(users)),
        catchError((err) => {
          console.error('Erreur de chargement des utilisateurs', err);
          this._error.set('Impossible de charger les utilisateurs');
          this._users.set([]);
          return of([]);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  deleteUser(id: number) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .delete<{ message: string }>(`${environment.apiUrl}/users/${id}`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.mutationMessage.set(response?.message ?? 'Utilisateur supprimé.');
          this.mutationStatus.set('success');
          this.loadAll();
        }),
        catchError((err) => {
          console.error('Erreur suppression utilisateur', err);
          this.mutationMessage.set(
            err?.error?.error ?? 'Suppression impossible. Réessayez plus tard.',
          );
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  createUser(payload: CreateUserPayload) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .post<{ message: string }>(`${environment.apiUrl}/users`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.mutationMessage.set(response?.message ?? 'Utilisateur créé.');
          this.mutationStatus.set('success');
          this.loadAll();
        }),
        catchError((err) => {
          console.error('Erreur création utilisateur', err);
          this.mutationMessage.set(
            err?.error?.error ?? 'Création impossible. Réessayez plus tard.',
          );
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  updateUser(id: number, payload: UpdateUserPayload) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .put<{ message: string; user: UserDto }>(
        `${environment.apiUrl}/users/${id}`,
        payload,
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.mutationMessage.set(response?.message ?? 'Utilisateur mis à jour.');
          this.mutationStatus.set('success');
          if (response?.user) {
            this.patchUser(response.user.id, response.user);
          } else {
            this.patchUser(id, this.toUserPatch(payload));
          }
          this.loadAll();
        }),
        catchError((err) => {
          console.error('Erreur mise à jour utilisateur', err);
          this.mutationMessage.set(
            err?.error?.error ?? 'Mise à jour impossible. Réessayez plus tard.',
          );
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  private patchUser(id: number, patch: Partial<UserDto>) {
    if (!Object.keys(patch).length) {
      return;
    }
    this._users.update((users) =>
      users.map((user) => (user.id === id ? { ...user, ...patch } : user)),
    );
  }

  private toUserPatch(payload: UpdateUserPayload): Partial<UserDto> {
    const patch: Partial<UserDto> = {};
    if (payload.login !== undefined) {
      patch.login = payload.login;
    }
    if (payload.firstName !== undefined) {
      patch.firstName = payload.firstName;
    }
    if (payload.lastName !== undefined) {
      patch.lastName = payload.lastName;
    }
    if (payload.email !== undefined) {
      patch.email = payload.email;
    }
    if (payload.phone !== undefined) {
      patch.phone = payload.phone ?? null;
    }
    if (payload.avatarUrl !== undefined) {
      patch.avatarUrl = payload.avatarUrl ?? null;
    }
    if (payload.role !== undefined) {
      patch.role = payload.role;
    }
    if (payload.emailVerified !== undefined) {
      patch.emailVerified = payload.emailVerified;
    }
    return patch;
  }
}
