import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // si hay token, puede pasar
  if (authService.isLoggedIn()) {
    return true;
  }

  // si NO hay token → redirigir al login
  return router.createUrlTree(['/login']);
};
