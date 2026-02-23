import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectDto } from '../core/models/project.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ✅ GET /api/projects?search=
  getMyProjects(search: string = ''): Observable<ProjectDto[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());

    return this.http.get<ProjectDto[]>(`${this.apiUrl}/projects`, { params });
  }

  // ✅ POST /api/projects (multipart)
  uploadProject(title: string, description: string, file: File): Observable<ProjectDto> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description ?? '');
    formData.append('file', file);

    return this.http.post<ProjectDto>(`${this.apiUrl}/projects`, formData);
  }

  // ✅ PATCH /api/projects/:id
  updateProject(id: number, data: Partial<ProjectDto>): Observable<ProjectDto> {
    return this.http.patch<ProjectDto>(`${this.apiUrl}/projects/${id}`, data);
  }

  // ✅ DELETE /api/projects/:id
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  // ✅ GET /api/projects/:id/download (blob)
  downloadProject(id: number): Observable<{ blob: Blob; filename: string }> {
    return this.http
      .get(`${this.apiUrl}/projects/${id}/download`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((res: HttpResponse<Blob>) => {
          const contentDisposition = res.headers.get('content-disposition') || '';
          const match = /filename="(.+)"/.exec(contentDisposition);
          const filename = match?.[1] || `project-${id}`;
          return { blob: res.body as Blob, filename };
        }),
      );
  }
}
