import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // backend Nest

  constructor(private http: HttpClient) {}

  // 👇 LOGIN SOLO CON CORREO
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          if (typeof window !== 'undefined') {
            // el backend devuelve { access_token: '...' }
            localStorage.setItem('token', res.access_token);
          }
        })
      );
  }

  // 👇 REGISTER (nombre, correo, contraseña)
  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, {
      name,
      email,
      password,
      // si tu backend acepta role opcional puedes añadirlo aquí:
      // role: 'usuario'
    });
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserFromToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return this.getUserFromToken()?.role ?? null;
  }
}
