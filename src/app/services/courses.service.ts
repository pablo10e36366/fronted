import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private baseUrl = 'http://localhost:3000/api';

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async parseError(res: Response): Promise<string> {
    const json = await res.json().catch(() => null);

    if (res.status === 401) return 'No estás logueado (token inválido o expirado)';
    if (res.status === 403) return 'No tienes permisos (entra con cuenta DOCENTE)';

    // si viene string/array, lo convertimos
    const msg = json?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;

    return 'Error inesperado';
  }

  async myCourses(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/courses/my`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) throw new Error(await this.parseError(res));
    return res.json();
  }

  async createCourse(data: { name: string; description?: string }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/courses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(await this.parseError(res));
    return res.json();
  }

  async joinCourse(code: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/courses/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ code }),
    });

    if (!res.ok) throw new Error(await this.parseError(res));
    return res.json();
  }
}
