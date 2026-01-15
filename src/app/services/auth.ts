import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ROUTES } from '../core/api.routes';
import {
  JwtUserPayload,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../core/models/auth.models';
import { decodeJwtPayload } from '../core/utils/jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}${API_ROUTES.auth.login}`, body)
      .pipe(
        tap((res) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', res.access_token);
          }
        })
      );
  }

  register(name: string, email: string, password: string): Observable<any> {
    const body: RegisterRequest = { name, email, password };
    return this.http.post(`${this.apiUrl}${API_ROUTES.auth.register}`, body);
  }

  logout(): void {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserFromToken(): JwtUserPayload | null {
    const token = this.getToken();
    if (!token) return null;
    return decodeJwtPayload(token);
  }

  getRole(): string | null {
    return this.getUserFromToken()?.role ?? null;
  }
}
