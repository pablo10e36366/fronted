import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AssignmentStatus } from '../core/models/assignment.models';

export interface Assignment {
  id: string;
  projectId: string;
  milestoneId: string | null;
  studentId: number;
  evidenceId: string | null;
  status: AssignmentStatus;
  feedback: string | null;
  submittedAt: Date | null;
  deadline: Date | null;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
  student?: { id: number; name: string; email: string };
  milestone?: { id: string; title: string };
  evidence?: { id: string; title: string };
}

export interface ReviewAssignmentDto {
  feedback: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly apiUrl = `${environment.apiUrl}/assignments`;

  constructor(private http: HttpClient) { }

  /**
   * GET /assignments/project/:projectId
   * Lista todas las entregas de un proyecto específico.
   */
  getByProject(projectId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/project/${projectId}`);
  }

  /**
   * PATCH /assignments/:id/review
   * Marca una entrega como REVISADA y agrega feedback.
   */
  review(id: string, feedback: string): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.apiUrl}/${id}/review`, { feedback });
  }

  /**
   * GET /assignments/:id
   * Obtiene una entrega por ID.
   */
  getOne(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /assignments
   * Crea una nueva entrega (assignment).
   */
  create(assignment: {
    projectId: string;
    milestoneId?: string;
    studentId: number;
    evidenceId?: string;
    status?: AssignmentStatus;
    feedback?: string;
  }): Observable<Assignment> {
    return this.http.post<Assignment>(this.apiUrl, assignment);
  }

  /**
   * PATCH /assignments/:id/status
   * Cambia el estado de una entrega.
   */
  changeStatus(id: string, status: AssignmentStatus): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * DELETE /assignments/:id
   * Elimina una entrega.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
