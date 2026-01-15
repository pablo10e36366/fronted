import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_ROUTES } from '../core/api.routes';
import { ProjectDto } from '../core/models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyProjects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.apiUrl}${API_ROUTES.projects.base}`);
  }

  uploadProject(title: string, description: string, file: File): Observable<ProjectDto> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    return this.http.post<ProjectDto>(`${this.apiUrl}${API_ROUTES.projects.base}`, formData);
  }

  downloadProjectFile(projectId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${API_ROUTES.projects.download(projectId)}`, {
      responseType: 'blob',
    });
  }
}
