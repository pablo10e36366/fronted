import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { API_ROUTES } from '../core/api.routes';
import {
  JwtUserPayload,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../core/models/auth.models';
import { decodeJwtPayload, isTokenValid } from '../core/utils/jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'auth_refresh_token';

  private currentUserSubject =
    new BehaviorSubject<JwtUserPayload | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Inicializar usuario desde token si existe y es válido
    if (typeof window !== 'undefined') {
      // MigraciÃ³n simple: si el token estaba en localStorage (versiÃ³n anterior),
      // moverlo a sessionStorage para que sea por pestaÃ±a.
      const sessionToken = sessionStorage.getItem(this.tokenKey);
      const legacyToken = localStorage.getItem(this.tokenKey);
      if (!sessionToken && legacyToken) {
        sessionStorage.setItem(this.tokenKey, legacyToken);
        localStorage.removeItem(this.tokenKey);
      }

      const sessionRefresh = sessionStorage.getItem(this.refreshTokenKey);
      const legacyRefresh = localStorage.getItem(this.refreshTokenKey);
      if (!sessionRefresh && legacyRefresh) {
        sessionStorage.setItem(this.refreshTokenKey, legacyRefresh);
        localStorage.removeItem(this.refreshTokenKey);
      }

      const token = this.getToken();

      if (token && isTokenValid(token)) {
        const payload = decodeJwtPayload(token);
        this.currentUserSubject.next(payload);
      } else {
        this.clearLocalAuth();
      }
    }
  }

  /* ===========================
   * AUTH
   * =========================== */

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}${API_ROUTES.auth.login}`,
        body
      )
      .pipe(
        tap((res) => {
          if (typeof window === 'undefined') return;

          // Guardar en sessionStorage (por pestaña)
          sessionStorage.setItem(this.tokenKey, res.access_token);
          if (res.refresh_token) {
            sessionStorage.setItem(this.refreshTokenKey, res.refresh_token);
          }
          // Limpiar token legado en localStorage si existía
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.refreshTokenKey);

          const payload = decodeJwtPayload(res.access_token);
          // Normalizar rol a minúsculas para consistencia con el backend
          const normalizedPayload = {
            ...payload,
            role: payload?.role ? String(payload.role).toLowerCase() : payload?.role,
          } as JwtUserPayload;

          this.currentUserSubject.next(normalizedPayload);

          // Redirección por rol (docente => /)
          if (normalizedPayload?.role === 'docente' || normalizedPayload?.role === 'colaborador') {
            this.router.navigate(['/']);
          } else if (normalizedPayload?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/projects']);
          }
        }),
        catchError(this.handleError)
      );
  }

  startGoogleOtp(
    email: string
  ): Observable<{
    success: boolean;
    expires_in_seconds: number;
    cooldown_seconds: number;
  }> {
    return this.http
      .post<{
        success: boolean;
        expires_in_seconds: number;
        cooldown_seconds: number;
      }>(`${this.apiUrl}${API_ROUTES.auth.googleOtpStart}`, { email })
      .pipe(
        catchError((err) => {
          console.error('[AuthService.startGoogleOtp]', err);
          return throwError(() => err);
        }),
      );
  }

  verifyGoogleOtp(email: string, code: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}${API_ROUTES.auth.googleOtpVerify}`, {
        email,
        code,
        password,
      })
      .pipe(
        tap((res) => {
          if (typeof window === 'undefined') return;

          sessionStorage.setItem(this.tokenKey, res.access_token);
          if (res.refresh_token) {
            sessionStorage.setItem(this.refreshTokenKey, res.refresh_token);
          }
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.refreshTokenKey);

          const payload = decodeJwtPayload(res.access_token);
          const normalizedPayload = {
            ...payload,
            role: payload?.role ? String(payload.role).toLowerCase() : payload?.role,
          } as JwtUserPayload;

          this.currentUserSubject.next(normalizedPayload);

          if (
            normalizedPayload?.role === 'docente' ||
            normalizedPayload?.role === 'colaborador'
          ) {
            this.router.navigate(['/']);
          } else if (normalizedPayload?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/projects']);
          }
        }),
        catchError((err) => {
          console.error('[AuthService.verifyGoogleOtp]', err);
          return throwError(() => err);
        }),
      );
  }

  register(
    name: string,
    email: string,
    password: string
  ): Observable<any> {
    const body: RegisterRequest = { name, email, password };

    return this.http
      .post(`${this.apiUrl}${API_ROUTES.auth.register}`, body)
      .pipe(
        tap(() => {}),
        // En registro queremos propagar el error real (409, 400, etc.) para mostrarlo en UI
        catchError((err) => {
          console.error('[AuthService.register]', err);
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.http
        .post(`${this.apiUrl}${API_ROUTES.auth.logout}`, { refresh_token: refresh })
        .subscribe({ error: () => {} });
    }

    this.clearLocalAuth();
    this.router.navigate(['/login']);
  }

  private clearLocalAuth() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.refreshTokenKey);
      // Limpieza por compatibilidad si quedÃ³ algo viejo
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
    this.currentUserSubject.next(null);
  }

  /* ===========================
   * HELPERS (compatibilidad con el resto del app)
   * =========================== */

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  refreshAccessToken(): Observable<string> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}${API_ROUTES.auth.refresh}`, { refresh_token: refresh })
      .pipe(
        tap((res) => {
          if (typeof window === 'undefined') return;
          sessionStorage.setItem(this.tokenKey, res.access_token);

          const payload = decodeJwtPayload(res.access_token);
          const normalizedPayload = {
            ...payload,
            role: payload?.role ? String(payload.role).toLowerCase() : payload?.role,
          } as JwtUserPayload;

          this.currentUserSubject.next(normalizedPayload);
        }),
        map((res) => res.access_token),
        catchError(this.handleError),
      );
  }

  getUserFromToken(): JwtUserPayload | null {
    const token = this.getToken();
    if (!token || !isTokenValid(token)) return null;
    return decodeJwtPayload(token);
  }

  // Nombre originalmente usado por varias partes del proyecto
  getRole(): string | null {
    const user = this.getUserFromToken();
    return user?.role ?? null;
  }

  // Otro nombre usado por guards
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && isTokenValid(token);
  }

  hasRole(wantedRole: string): boolean {
    const role = this.getRole();
    if (!role) return false;
    return role === wantedRole;
  }

  /* ===========================
   * ERROR HANDLING
   * =========================== */

  private handleError(error: any): Observable<never> {
    console.error('[AuthService]', error);
    return throwError(
      () => new Error('Error de autenticación. Intenta nuevamente.')
    );
  }
}
