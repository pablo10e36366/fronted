import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: number;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;   // si tu backend manda camelCase
  created_at?: string;  // si tu backend manda snake_case
  fileUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000'; // cambia si tu backend usa otro puerto

  constructor(private http: HttpClient) {}

  getMyProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  uploadProject(
    title: string,
    description: string,
    file: File
  ): Observable<Project> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file); // mismo nombre que en el backend

    return this.http.post<Project>(`${this.apiUrl}/projects`, formData);
  }

  downloadProjectFile(projectId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/projects/${projectId}/download`, {
      responseType: 'blob',
    });
  }
}
