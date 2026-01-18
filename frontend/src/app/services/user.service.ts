import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserDto, UserRole } from '@app/types/user-dto';
import { environment } from '@env/environment';
import { catchError, finalize, of, tap } from 'rxjs';

export type CreateUserPayload = {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
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

type CreateUserResponse = {
  message: string;
  user?: UserDto;
};

type UpdateUserResponse = {
  message: string;
  user?: UserDto;
};

type DeleteUserResponse = {
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  readonly users = signal<UserDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isMutating = signal(false);
  readonly mutationMessage = signal<string | null>(null);
  readonly mutationStatus = signal<'success' | 'error' | null>(null);

  // Role : Charger la liste des utilisateurs.
  // Preconditions : L'API est accessible.
  // Postconditions : Les signaux users, error et isLoading sont mis a jour.
  loadAll() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<UserDto[]>(`${environment.apiUrl}/users`, { withCredentials: true })
      .pipe(
        tap((users) => this.users.set(users ?? [])),
        catchError((err) => {
          this.error.set(err?.error?.error ?? 'Erreur chargement utilisateurs');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe();
  }

  // Role : Creer un utilisateur.
  // Preconditions : payload contient les champs requis.
  // Postconditions : Lance la creation et rafraichit la liste si succes.
  createUser(payload: CreateUserPayload) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .post<CreateUserResponse>(`${environment.apiUrl}/users`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.mutationMessage.set(response?.message ?? 'Utilisateur cree');
          this.mutationStatus.set('success');
          this.loadAll();
        }),
        catchError((err) => {
          this.mutationMessage.set(err?.error?.error ?? 'Creation impossible');
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  // Role : Mettre a jour un utilisateur.
  // Preconditions : userId est valide et payload contient les champs a modifier.
  // Postconditions : Met a jour le store local et rafraichit la liste.
  updateUser(userId: number, payload: UpdateUserPayload) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .put<UpdateUserResponse>(`${environment.apiUrl}/users/${userId}`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response?.user) {
            this.replaceUser(response.user);
          } else {
            this.patchUser(userId, payload);
          }
          this.mutationMessage.set(response?.message ?? 'Utilisateur mis a jour');
          this.mutationStatus.set('success');
          this.loadAll();
        }),
        catchError((err) => {
          this.mutationMessage.set(err?.error?.error ?? 'Mise a jour impossible');
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  // Role : Supprimer un utilisateur.
  // Preconditions : userId est valide.
  // Postconditions : Lance la suppression et rafraichit la liste.
  deleteUser(userId: number) {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.mutationMessage.set(null);
    this.mutationStatus.set(null);

    this.http
      .delete<DeleteUserResponse>(`${environment.apiUrl}/users/${userId}`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.mutationMessage.set(response?.message ?? 'Utilisateur supprime');
          this.mutationStatus.set('success');
          this.loadAll();
        }),
        catchError((err) => {
          this.mutationMessage.set(err?.error?.error ?? 'Suppression impossible');
          this.mutationStatus.set('error');
          return of(null);
        }),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe();
  }

  // Role : Remplacer un utilisateur dans la liste locale.
  // Preconditions : L'objet user est valide.
  // Postconditions : Le signal users est mis a jour.
  private replaceUser(user: UserDto) {
    this.users.update((current) => {
      const index = current.findIndex((item) => item.id === user.id);
      if (index === -1) {
        return [...current, user];
      }
      const next = [...current];
      next[index] = user;
      return next;
    });
  }

  // Role : Appliquer un patch local aux donnees utilisateur.
  // Preconditions : userId est valide et payload contient les champs a mettre a jour.
  // Postconditions : Le signal users est mis a jour avec le patch.
  private patchUser(userId: number, payload: UpdateUserPayload) {
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
    if (Object.prototype.hasOwnProperty.call(payload, 'phone')) {
      patch.phone = payload.phone ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'avatarUrl')) {
      patch.avatarUrl = payload.avatarUrl ?? null;
    }
    if (payload.role !== undefined) {
      patch.role = payload.role;
    }
    if (payload.emailVerified !== undefined) {
      patch.emailVerified = payload.emailVerified;
    }

    this.users.update((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    );
  }
}
