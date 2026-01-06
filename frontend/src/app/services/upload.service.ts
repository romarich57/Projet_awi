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

    // Cache-busting timestamp to force browser to reload avatars
    readonly avatarCacheBuster = signal(Date.now());

    /**
     * Upload un fichier avatar et retourne l'URL du fichier uploadé.
     * Respecte Cours.md : HTTP encapsulé dans un service, pas dans un composant.
     */
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
                    // Update cache buster to force reload of all avatars
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

    /**
     * Upload une image de jeu et retourne l'URL du fichier uploadé.
     */
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

    /**
     * Force le rechargement de tous les avatars en invalidant le cache.
     */
    invalidateAvatarCache(): void {
        this.avatarCacheBuster.set(Date.now());
    }

    /**
     * Construit l'URL complète de l'avatar avec cache-busting.
     * Si l'avatarUrl est null/undefined, retourne l'avatar par défaut.
     */
    getAvatarUrl(avatarUrl: string | null | undefined): string {
        if (!avatarUrl) {
            return DEFAULT_AVATAR_URL;
        }
        const cacheBuster = `?t=${this.avatarCacheBuster()}`;
        // Si c'est un chemin relatif commençant par /uploads
        if (avatarUrl.startsWith('/uploads')) {
            return `${environment.apiUrl.replace('/api', '')}${avatarUrl}${cacheBuster}`;
        }
        // Si c'est déjà une URL complète
        return `${avatarUrl}${cacheBuster}`;
    }
}
