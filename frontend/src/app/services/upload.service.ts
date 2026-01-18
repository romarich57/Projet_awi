import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

export const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

type UploadAvatarResponse = {
    url: string;
    message: string;
};

@Injectable({
    providedIn: 'root',
})
export class UploadService {
    private readonly http = inject(HttpClient);

    readonly isUploading = signal(false);
    readonly uploadError = signal<string | null>(null);

    // Horodatage pour forcer le rechargement navigateur des avatars
    readonly avatarCacheBuster = signal(Date.now());

    // Role : Uploader un avatar et retourner l'URL du fichier.
    // Preconditions : Le fichier est fourni et le service HTTP est disponible.
    // Postconditions : Met a jour uploadError et avatarCacheBuster selon le resultat.
    uploadAvatar(file: File): Observable<string | null> {
        this.isUploading.set(true);
        this.uploadError.set(null);

        const formData = new FormData();
        formData.append('avatar', file);

        return this.http
            .post<UploadAvatarResponse>(`${environment.apiUrl}/upload/avatar`, formData, {
                withCredentials: true,
            })
            .pipe(
                map((response) => response.url),
                tap(() => {
                    this.uploadError.set(null);
                    // Met a jour le cache buster pour recharger tous les avatars
                    this.avatarCacheBuster.set(Date.now());
                }),
                catchError((err) => {
                    console.error('Erreur upload avatar:', err);
                    this.uploadError.set(err?.error?.error ?? 'Erreur lors de l\'upload');
                    return of(null);
                }),
                finalize(() => this.isUploading.set(false)),
            );
    }

    // Role : Uploader une image de jeu et retourner l'URL du fichier.
    // Preconditions : Le fichier est fourni et le service HTTP est disponible.
    // Postconditions : Met a jour uploadError selon le resultat.
    uploadGameImage(file: File): Observable<string | null> {
        this.isUploading.set(true);
        this.uploadError.set(null);

        const formData = new FormData();
        formData.append('image', file);

        return this.http
            .post<UploadAvatarResponse>(`${environment.apiUrl}/upload/game-image`, formData, {
                withCredentials: true,
            })
            .pipe(
                map((response) => response.url),
                tap(() => {
                    this.uploadError.set(null);
                }),
                catchError((err) => {
                    console.error('Erreur upload image de jeu:', err);
                    this.uploadError.set(err?.error?.error ?? 'Erreur lors de l\'upload');
                    return of(null);
                }),
                finalize(() => this.isUploading.set(false)),
            );
    }

    // Role : Forcer le rechargement des avatars en invalidant le cache.
    // Preconditions : Aucune.
    // Postconditions : Le cache buster est mis a jour.
    invalidateAvatarCache(): void {
        this.avatarCacheBuster.set(Date.now());
    }

    // Role : Construire l'URL complete de l'avatar avec cache-busting.
    // Preconditions : avatarUrl peut etre null/undefined.
    // Postconditions : Retourne une URL exploitable par l'UI.
    getAvatarUrl(avatarUrl: string | null | undefined): string {
        if (!avatarUrl) {
            return DEFAULT_AVATAR_URL;
        }
        const cacheBuster = `?t=${this.avatarCacheBuster()}`;
        // Si c'est un chemin relatif commencant par /uploads
        if (avatarUrl.startsWith('/uploads')) {
            return `${environment.apiUrl.replace('/api', '')}${avatarUrl}${cacheBuster}`;
        }
        // Si c'est deja une URL complete
        return `${avatarUrl}${cacheBuster}`;
    }
}
