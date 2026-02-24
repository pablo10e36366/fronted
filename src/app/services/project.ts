import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { API_ROUTES } from '../core/api.routes';
import { ProjectDto, RepositoryViewDto } from '../core/models/project.models';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
  ) {}

  archiveProject(id: string, reason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/archive`, { reason }).pipe(
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${id}/archive`, { reason })),
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}/admin/projects/${id}/archive`, { reason })),
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}/admin/courses/${id}/archive`, { reason })),
      catchError(() => this.archiveViaLegacyEndpoint(id, reason)),
      catchError(() => this.forceStatusViaLegacyEndpoint(id, ['archived', 'ARCHIVED', 'closed', 'CLOSED'], reason)),
      catchError(() => this.tryForceStatusVariants(id, ['archived', 'ARCHIVED', 'closed', 'CLOSED'], reason)),
      catchError(() => this.tryChangeStatusVariants(id, ['archived', 'ARCHIVED', 'closed', 'CLOSED'])),
      catchError(this.handleError),
    );
  }

  unarchiveProject(id: string, reason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/unarchive`, { reason }).pipe(
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${id}/unarchive`, { reason })),
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/restore`, { reason })),
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}/admin/projects/${id}/unarchive`, { reason })),
      catchError(() => this.http.patch<ProjectDto>(`${this.apiUrl}/admin/courses/${id}/unarchive`, { reason })),
      catchError(() => this.unarchiveViaLegacyEndpoint(id, reason)),
      catchError(() => this.forceStatusViaLegacyEndpoint(id, ['draft', 'DRAFT', 'in_progress', 'IN_PROGRESS'], reason)),
      catchError(() => this.tryForceStatusVariants(id, ['draft', 'DRAFT', 'in_progress', 'IN_PROGRESS'], reason)),
      catchError(() => this.tryChangeStatusVariants(id, ['draft', 'DRAFT', 'in_progress', 'IN_PROGRESS'])),
      catchError(this.handleError),
    );
  }

  forceStatusChange(id: string, forceStatusValue: string, forceStatusReason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/force-status`, {
      status: forceStatusValue,
      reason: forceStatusReason,
    }).pipe(catchError(this.handleError));
  }

  getProjectTransitions(id: string): Observable<{ currentStatus: string; availableStates: string[] }> {
    return this.http.get<{ currentStatus: string; availableStates: string[] }>(
      `${this.apiUrl}${API_ROUTES.projects.base}/${id}/transitions`,
    ).pipe(catchError(this.handleError));
  }

  /**
   * Centralized error handler - receives string errors from interceptor
   */
  private handleError = (error: unknown): Observable<never> => {
    const errorMessage = this.extractErrorMessage(error);
    console.error('Error en ProjectService:', errorMessage);
    this.notificationService.showError(errorMessage);
    return throwError(() => errorMessage);
  };

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) return error;

    if (error instanceof HttpErrorResponse) {
      const payload = error.error as unknown;
      if (typeof payload === 'string' && payload.trim()) return payload;

      if (payload && typeof payload === 'object') {
        const message = (payload as { message?: unknown }).message;
        if (Array.isArray(message) && message.length > 0) return String(message[0]);
        if (typeof message === 'string' && message.trim()) return message;
      }

      if (typeof error.message === 'string' && error.message.trim()) return error.message;
      return `Error HTTP ${error.status}`;
    }

    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Ocurrio un error inesperado';
  }

  private tryForceStatusVariants(
    id: string,
    statusVariants: string[],
    reason: string,
    index = 0,
    lastError?: unknown,
  ): Observable<ProjectDto> {
    if (index >= statusVariants.length) {
      return throwError(() => new Error(this.extractErrorMessage(lastError)));
    }

    const status = statusVariants[index];
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/force-status`, {
      status,
      reason,
    }).pipe(
      catchError((error) => this.tryForceStatusVariants(id, statusVariants, reason, index + 1, error)),
    );
  }

  private tryChangeStatusVariants(
    id: string,
    statusVariants: string[],
    index = 0,
    lastError?: unknown,
  ): Observable<ProjectDto> {
    if (index >= statusVariants.length) {
      return throwError(() => new Error(this.extractErrorMessage(lastError)));
    }

    const status = statusVariants[index];
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${id}/status`, {
      status,
    }).pipe(
      catchError((error) => this.tryChangeStatusVariants(id, statusVariants, index + 1, error)),
    );
  }

  private archiveViaLegacyEndpoint(id: string, reason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/archive`, {
      id,
      reason,
    }).pipe(
      catchError(() =>
        this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/archive`, {
          projectId: id,
          reason,
        }),
      ),
    );
  }

  private unarchiveViaLegacyEndpoint(id: string, reason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/unarchive`, {
      id,
      reason,
    }).pipe(
      catchError(() =>
        this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/unarchive`, {
          projectId: id,
          reason,
        }),
      ),
      catchError(() =>
        this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/restore`, {
          id,
          reason,
        }),
      ),
      catchError(() =>
        this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/restore`, {
          projectId: id,
          reason,
        }),
      ),
    );
  }

  private forceStatusViaLegacyEndpoint(id: string, statuses: string[], reason: string, index = 0): Observable<ProjectDto> {
    if (index >= statuses.length) {
      return throwError(() => new Error('No se pudo aplicar force-status legacy'));
    }

    const status = statuses[index];
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/force`, {
      id,
      status,
      reason,
    }).pipe(
      catchError(() =>
        this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/force`, {
          projectId: id,
          status,
          reason,
        }),
      ),
      catchError(() => this.forceStatusViaLegacyEndpoint(id, statuses, reason, index + 1)),
    );
  }

  getMyProjects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.apiUrl}${API_ROUTES.projects.base}`)
      .pipe(catchError(this.handleError));
  }

  getAllProjects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.apiUrl}${API_ROUTES.projects.base}/all`)
      .pipe(catchError(this.handleError));
  }

  uploadProject(title: string, description: string, file?: File | null): Observable<ProjectDto> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }

    const projectId = crypto.randomUUID();
    return this.http.post<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.create(projectId)}`, formData)
      .pipe(catchError(this.handleError));
  }

  downloadProjectFile(projectId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${API_ROUTES.projects.download(projectId)}`, {
      responseType: 'blob',
    }).pipe(catchError(this.handleError));
  }

  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}`)
      .pipe(catchError(this.handleError));
  }

  updateProject(projectId: string, title: string, description: string, file?: File): Observable<ProjectDto> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }
    return this.http.put<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}`, formData)
      .pipe(catchError(this.handleError));
  }

  getProjectDetails(projectId: string): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}`)
      .pipe(catchError(this.handleError));
  }

  getRepositoryView(projectId: string): Observable<RepositoryViewDto> {
    return this.http.get<RepositoryViewDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}/repository`)
      .pipe(catchError(this.handleError));
  }

  searchProjects(query: string): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.apiUrl}${API_ROUTES.projects.base}/search`, { params: { q: query } })
      .pipe(catchError(this.handleError));
  }

  submitReview(projectId: string, review: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects/${projectId}/reviews`, review)
      .pipe(catchError(this.handleError));
  }

  getReviews(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/${projectId}/reviews`)
      .pipe(catchError(this.handleError));
  }

  changeProjectStatus(projectId: string, status: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  getProjectHistory(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}${API_ROUTES.projects.base}/${projectId}/activity`)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /projects/join
   * Unirse a un curso/proyecto por codigo de acceso.
   */
  joinByCode(code: string): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/join`, { code })
      .pipe(catchError(this.handleError));
  }
}
