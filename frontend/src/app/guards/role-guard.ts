import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service'; // Ton service d'auth

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  //role du user courant
  const userRole = authService.currentUser()?.role; 

  // Récupération des rôles attendus depuis les données de la route
  const expectedRoles = route.data['roles'] as Array<string>;


  if (userRole && expectedRoles.includes(userRole)) {
    return true; 
  }

 
  if (!userRole) { //si on a pas de role (non connecté)
      return router.createUrlTree(['/login']);
  }
  
  return router.createUrlTree(['/']); // Redirection vers l'accueil 
};