import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { UserDto } from '@app/types/user-dto';
import { environment } from '@env/environment';
import { catchError, finalize, of, tap } from 'rxjs';

export type UpdateProfilePayload = {
    login?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
};

type UpdateProfileResponse = {
    message: string;
    user: UserDto;
    emailVerificationSent?: boolean;
};

type DeleteProfileResponse = {
    message: string;
};

@Injectable({
    providedIn: 'root',
})
export class UserProfileService {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);

    readonly isMutating = signal(false);
    readonly mutationMessage = signal<string | null>(null);
    readonly mutationStatus = signal<'success' | 'error' | null>(null);
    readonly lastAction = signal<'update' | 'delete' | 'reset' | null>(null);

    // Role : Mettre a jour les informations du profil utilisateur.
    // Preconditions : payload contient les champs a modifier.
    // Postconditions : Met a jour mutationMessage, mutationStatus et relance la session.
    updateProfile(payload: UpdateProfilePayload) {
        if (this.isMutating()) {
            return;
        }

        this.isMutating.set(true);
        this.mutationMessage.set(null);
        this.mutationStatus.set(null);
        this.lastAction.set('update');

        this.http
            .put<UpdateProfileResponse>(`${environment.apiUrl}/users/me`, payload, {
                withCredentials: true,
            })
            .pipe(
                tap((response) => {
                    this.mutationMessage.set(response?.message ?? 'Profil mis à jour.');
                    this.mutationStatus.set('success');
                    this.auth.checkSession$().subscribe();
                }),
                catchError((err) => {
                    console.error('Erreur mise à jour profil', err);
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

    // Role : Demander une reinitialisation de mot de passe.
    // Preconditions : email est renseigne.
    // Postconditions : Met a jour mutationMessage et mutationStatus.
    requestPasswordReset(email: string) {
        if (this.isMutating()) {
            return;
        }

        if (!email) {
            this.mutationMessage.set('Email invalide.');
            this.mutationStatus.set('error');
            this.lastAction.set('reset');
            return;
        }

        this.isMutating.set(true);
        this.mutationMessage.set(null);
        this.mutationStatus.set(null);
        this.lastAction.set('reset');

        this.auth
            .requestPasswordReset(email)
            .pipe(
                tap((message) => {
                    this.mutationMessage.set(message ?? 'Email de réinitialisation envoyé.');
                    this.mutationStatus.set('success');
                }),
                catchError((err) => {
                    console.error('Erreur demande réinitialisation', err);
                    this.mutationMessage.set(err?.message ?? 'Demande impossible.');
                    this.mutationStatus.set('error');
                    return of(null);
                }),
                finalize(() => this.isMutating.set(false)),
            )
            .subscribe();
    }

    // Role : Supprimer le compte utilisateur courant.
    // Preconditions : Aucune.
    // Postconditions : Met a jour mutationMessage, mutationStatus et declenche logout.
    deleteAccount() {
        if (this.isMutating()) {
            return;
        }

        this.isMutating.set(true);
        this.mutationMessage.set(null);
        this.mutationStatus.set(null);
        this.lastAction.set('delete');

        this.http
            .delete<DeleteProfileResponse>(`${environment.apiUrl}/users/me`, {
                withCredentials: true,
            })
            .pipe(
                tap((response) => {
                    this.mutationMessage.set(response?.message ?? 'Compte supprimé.');
                    this.mutationStatus.set('success');
                    this.auth.logout();
                }),
                catchError((err) => {
                    console.error('Erreur suppression compte', err);
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
}
