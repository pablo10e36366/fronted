import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import { SessionService } from '../core/auth/data-access/session.service';

let isLoggingOut = false;
let refreshInFlight: ReturnType<SessionService['refreshAccessToken']> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const sessionService = inject(SessionService);

  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/register/verify',
    '/auth/refresh',
    '/auth/logout',
    '/auth/google-otp/start',
    '/auth/google-otp/verify',
  ];
  const isPublicRoute = publicRoutes.some((route) => req.url.includes(route));
  if (isPublicRoute) return next(req);

  const token = sessionService.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const refreshToken = sessionService.getRefreshToken();
        if (refreshToken) {
          if (!refreshInFlight) {
            refreshInFlight = sessionService.refreshAccessToken().pipe(
              shareReplay(1),
              finalize(() => {
                refreshInFlight = null;
              }),
            );
          }

          return refreshInFlight.pipe(
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }),
            catchError(() => {
              if (!isLoggingOut) {
                isLoggingOut = true;
                sessionService.logout();
                router.navigate(['/login'], {
                  queryParams: { reason: 'session_expired' },
                });
                setTimeout(() => {
                  isLoggingOut = false;
                }, 1000);
              }
              return throwError(() => error);
            }),
          );
        }
      }

      if (error.status === 401 && !isLoggingOut) {
        isLoggingOut = true;
        sessionService.logout();
        router.navigate(['/login'], {
          queryParams: { reason: 'session_expired' },
        });
        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      }

      return throwError(() => error);
    }),
  );
};
