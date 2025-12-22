import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

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
  if (excluded.some((path) => req.url.includes(path))) {
    // passe directement
    return next(req);
  }

  // --- Interception des autres requêtes ---
  return next(req).pipe(
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
            const retryReq = req.clone();
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
