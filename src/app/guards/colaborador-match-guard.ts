import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';

import { SessionService } from '../core/auth/data-access/session.service';

export const colaboradorMatchGuard: CanMatchFn = () => {
  const sessionService = inject(SessionService);

  if (!sessionService.isLoggedIn()) {
    return false;
  }

  const role = String(sessionService.getRole() || '').toLowerCase();
  return role === 'colaborador';
};
