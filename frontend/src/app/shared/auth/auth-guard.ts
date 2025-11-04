import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { catchError, map, of } from 'rxjs';

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
