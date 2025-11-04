import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { catchError, map, of } from 'rxjs';

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
