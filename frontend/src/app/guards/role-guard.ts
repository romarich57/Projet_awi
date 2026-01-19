import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { catchError, map, of } from 'rxjs';

// Role : Verifier si l'utilisateur possede l'un des roles requis pour acceder a la route.
// Preconditions : Le service d'authentification doit etre initialise. Les roles peuvent etre absents des donnees de route.
// Postconditions : Renvoie true si l'utilisateur a le role requis, sinon redirige vers '/login' ou '/' selon le cas.
export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Role du user courant
  const userRole = authService.currentUser()?.role;

  // Recuperation des roles attendus depuis les donnees de la route
  const expectedRoles = Array.isArray(route.data?.['roles'])
    ? (route.data['roles'] as Array<string>)
    : [];

  const evaluateRole = (role: string | null | undefined): boolean | UrlTree => {
    if (expectedRoles.length === 0) {
      return role ? true : router.createUrlTree(['/login']);
    }
    if (role && expectedRoles.includes(role)) {
      return true;
    }
    if (!role) {
      return router.createUrlTree(['/login']);
    }
    return router.createUrlTree(['/']);
  };

  if (userRole) {
    return evaluateRole(userRole);
  }

  return authService.checkSession$().pipe(
    map((user) => evaluateRole(user?.role)),
    catchError(() => of<UrlTree | boolean>(router.createUrlTree(['/login']))),
  );
};
