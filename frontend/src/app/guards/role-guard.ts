import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service'; 

// Role : Verifier si l'utilisateur possede l'un des roles requis pour acceder a la route.
// Preconditions : Le service d'authentification doit etre initialise. La route doit definir une propriete 'roles' dans ses données.
// Postconditions : Renvoie true si l'utilisateur a le role requis, sinon redirige vers '/login' ou '/' selon le cas.
export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Role du user courant
  const userRole = authService.currentUser()?.role;

  // Récupération des rôles attendus depuis les données de la route
  const expectedRoles = route.data['roles'] as Array<string>;


  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }


  if (!userRole) { // Si on n'a pas de role (non connecter)
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree(['/']); // Redirection vers l'accueil 
};
