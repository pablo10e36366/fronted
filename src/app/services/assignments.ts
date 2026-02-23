export class AssignmentsService {
  private baseUrl = 'http://localhost:3000/api';

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private buildHeaders(isJson: boolean = true): Headers {
    const headers = new Headers();
    const token = this.getToken();

    if (isJson) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    return headers;
  }

  private async parseError(res: Response): Promise<string> {
    const json = await res.json().catch(() => null);

    if (res.status === 401) return 'No estás logueado (token inválido o expirado)';
    if (res.status === 403) return 'No tienes permisos para esta acción';

    const msg = json?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;

    return 'Error inesperado';
  }

  async getAssignmentsByCourse(courseId: number): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/assignments/course/${courseId}`, {
      method: 'GET',
      headers: this.buildHeaders(true),
    });

    if (!res.ok) throw new Error(await this.parseError(res));
    return res.json();
  }

  async submitAssignment(assignmentId: number, file: File): Promise<any> {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${this.baseUrl}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: this.buildHeaders(false), // ✅ NO Content-Type
      body: form,
    });

    if (!res.ok) throw new Error(await this.parseError(res));
    return res.json();
  }
}
