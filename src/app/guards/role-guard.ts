import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { SessionService } from '../core/auth/data-access/session.service';

export const roleGuard: CanActivateFn = (route) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const userRoleRaw = sessionService.getRole();
  const userRole = userRoleRaw ? String(userRoleRaw).toLowerCase() : null;

  const excludedRoles = route.data?.['excludedRoles'] as string[] | undefined;
  if (excludedRoles && excludedRoles.length > 0) {
    const excluded = excludedRoles.map((role) => String(role).toLowerCase());
    if (userRole && excluded.includes(userRole)) {
      return userRole === 'docente'
        ? router.createUrlTree(['/'])
        : router.createUrlTree(['/projects']);
    }
    return true;
  }

  const expectedRole = route.data?.['expectedRole'];
  if (!expectedRole) return true;

  if (userRole === String(expectedRole).toLowerCase()) {
    return true;
  }

  return userRole === 'docente'
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/projects']);
};
