import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // --- Ne pas intercepter les requêtes d'auth elles-mêmes ---
  const excluded = ['/auth/login', '/auth/logout', '/auth/refresh'];
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
        // Si refresh réussi, rejouer la requête
        switchMap((ok) => (ok ? next(req) : throwError(() => err))),
        // si encore erreur, on termine
        catchError((refreshErr) => {
          auth.logout();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
