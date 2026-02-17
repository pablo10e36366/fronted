import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ROUTES } from '../core/api.routes';
import { ProjectDto, RepositoryViewDto } from '../core/models/project.models';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  archiveProject(id: string, reason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/archive`, { reason })
      .pipe(catchError(this.handleError));
  }

  forceStatusChange(id: string, forceStatusValue: string, forceStatusReason: string): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/admin/${id}/force-status`, {
      status: forceStatusValue,
      reason: forceStatusReason
    }).pipe(catchError(this.handleError));
  }

  getProjectTransitions(id: string): Observable<{ currentStatus: string; availableStates: string[] }> {
    return this.http.get<{ currentStatus: string; availableStates: string[] }>(
      `${this.apiUrl}${API_ROUTES.projects.base}/${id}/transitions`
    ).pipe(catchError(this.handleError));
  }
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) { }

  /**
   * Centralized error handler - receives string errors from interceptor
   */
  private handleError = (error: string | Error): Observable<never> => {
    const errorMessage = typeof error === 'string'
      ? error
      : error.message || 'Ocurrió un error inesperado';

    console.error('Error en ProjectService:', errorMessage);
    this.notificationService.showError(errorMessage);
    return throwError(() => errorMessage);
  };

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

    // Generar un UUID para el proyecto
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
   * Unirse a un curso/proyecto por código de acceso.
   */
  joinByCode(code: string): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}/join`, { code })
      .pipe(catchError(this.handleError));
  }
}

