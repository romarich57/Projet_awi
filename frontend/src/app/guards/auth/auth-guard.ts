import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { catchError, map, of } from 'rxjs';

// Role : Verifier si l'utilisateur est authentifie avant d'acceder a une route.
// Preconditions : AuthService et Router disponibles.
// Postconditions : Autorise l'acces si connecte, sinon redirige vers '/login'.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return auth.checkSession$().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
    catchError(() => of<UrlTree | boolean>(router.createUrlTree(['/login']))),
  );
};
