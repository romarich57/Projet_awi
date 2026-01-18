import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { catchError, map, of } from 'rxjs';

// Role : Empecher l'acces aux routes reservees aux administrateurs pour les utilisateurs non-admins.
// Preconditions : AuthService et Router disponibles.
// Postconditions : Autorise l'acces si l'utilisateur est admin, sinon redirige vers '/home' ou verifie la session.
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const fallback = router.createUrlTree(['/home']);

  if (auth.isAdmin()) {
    return true;
  }

  if (auth.isLoggedIn()) {
    return fallback;
  }

  return auth.checkSession$().pipe(
    map((user) => (user?.role === 'admin' ? true : fallback)),
    catchError(() => of<UrlTree | boolean>(fallback)),
  );
};
