import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { environment } from '@env/environment';
import { catchError, switchMap, throwError } from 'rxjs';

// Role : Intercepter les requetes HTTP pour gerer les erreurs d'authentification (401).
// Preconditions : Le service AuthService doit etre disponible.
// Postconditions : Si une erreur 401 survient, tente de rafraichir le token et de rejouer la requete. Si le rafraichissement echoue, deconnecte l'utilisateur.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const request = isApiRequest && !req.withCredentials
    ? req.clone({ withCredentials: true })
    : req;

  // --- Ne pas intercepter les requêtes d'auth elles-mêmes ---
  const excluded = [
    '/auth/login',
    '/auth/logout',
    '/auth/refresh',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/password/forgot',
    '/auth/password/reset',
  ];
  if (excluded.some((path) => request.url.includes(path))) {
    // passe directement
    return next(request);
  }

  // --- Interception des autres requêtes ---
  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        // si pas 401 on transmet au suivant
        return throwError(() => err);
      }

      // Si 401 on tente de refresh via Observable
      return auth.refresh$().pipe(
        // Si refresh réussi, rejouer la requête en la clonant
        switchMap((ok) => {
          if (ok) {
            // Clone la requête pour la rejouer
            const retryReq = request.clone();
            return next(retryReq);
          }
          return throwError(() => err);
        }),
        // si encore erreur, on termine
        catchError((refreshErr) => {
          auth.logout();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
