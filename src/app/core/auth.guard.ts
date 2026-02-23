import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // en Vite/SSR no bloquear
  if (typeof window === 'undefined') return true;

  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/login']);
};
