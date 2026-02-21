import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../../../services/auth';
import { JwtUserPayload, LoginResponse, RegisterResponse } from '../../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly currentUser$: Observable<JwtUserPayload | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.authService.login(email, password);
  }

  register(name: string, email: string, password: string): Observable<RegisterResponse> {
    return this.authService.register(name, email, password);
  }

  resendRegistrationPin(
    email: string,
  ): Observable<{ success: boolean; message: string; cooldown_seconds: number }> {
    return this.authService.resendRegistrationPin(email);
  }

  verifyRegistration(email: string, code: string): Observable<LoginResponse> {
    return this.authService.verifyRegistration(email, code);
  }

  startGoogleOtp(
    email: string,
  ): Observable<{
    success: boolean;
    expires_in_seconds: number;
    cooldown_seconds: number;
  }> {
    return this.authService.startGoogleOtp(email);
  }

  verifyGoogleOtp(
    email: string,
    code: string,
    password: string,
  ): Observable<LoginResponse> {
    return this.authService.verifyGoogleOtp(email, code, password);
  }

  getToken(): string | null {
    return this.authService.getToken();
  }

  getRefreshToken(): string | null {
    return this.authService.getRefreshToken();
  }

  refreshAccessToken(): Observable<string> {
    return this.authService.refreshAccessToken();
  }

  getUserFromToken(): JwtUserPayload | null {
    return this.authService.getUserFromToken();
  }

  getRole(): string | null {
    return this.authService.getRole();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  hasRole(wantedRole: string): boolean {
    return this.authService.hasRole(wantedRole);
  }

  logout(): void {
    this.authService.logout();
  }
}
