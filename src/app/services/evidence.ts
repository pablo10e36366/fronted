import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateEvidenceDto, EvidenceDto, EvidenceStatus } from '../core/models/project.models';
import { NotificationService } from './notification.service';

export interface CreateFolderDto {
  projectId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
}

export interface CreateFileDto {
  projectId: string;
  milestoneId?: string | null;
  parentId?: string | null;
  name?: string | null;
  file: File;
}

export interface StudentFilesByActivityGroup {
  activityId: string | null;
  activityTitle: string;
  files: EvidenceDto[];
}

export interface LockResponse {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class EvidenceService {
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
      : error.message || 'Error en evidencias';

    console.error('Error en EvidenceService:', errorMessage);
    this.notificationService.showError(errorMessage);
    return throwError(() => errorMessage);
  };

  // --- LEGACY ---

  createEvidence(projectId: string, data: CreateEvidenceDto): Observable<EvidenceDto> {
    return this.http.post<EvidenceDto>(`${this.apiUrl}/evidences`, {
      ...data,
      projectId,
    }).pipe(catchError(this.handleError));
  }

  getEvidenceById(evidenceId: string): Observable<EvidenceDto> {
    return this.http.get<EvidenceDto>(`${this.apiUrl}/evidences/${evidenceId}`)
      .pipe(catchError(this.handleError));
  }

  reviewEvidence(evidenceId: string, status: EvidenceStatus, feedback: string): Observable<EvidenceDto> {
    return this.http.patch<EvidenceDto>(`${this.apiUrl}/evidences/${evidenceId}/review`, {
      status,
      feedback,
    }).pipe(catchError(this.handleError));
  }

  // --- FILE SYSTEM API ---

  createFolder(dto: CreateFolderDto): Observable<EvidenceDto> {
    return this.http.post<EvidenceDto>(`${this.apiUrl}/evidences/folders`, dto)
      .pipe(catchError(this.handleError));
  }

  createFile(dto: CreateFileDto): Observable<EvidenceDto> {
    const formData = new FormData();
    formData.append('projectId', dto.projectId);
    if (dto.milestoneId) {
      formData.append('milestoneId', dto.milestoneId);
    }
    if (dto.parentId) {
      formData.append('parentId', dto.parentId);
    }
    if (dto.name) {
      formData.append('name', dto.name);
    }
    formData.append('file', dto.file);

    return this.http.post<EvidenceDto>(`${this.apiUrl}/evidences/files`, formData)
      .pipe(catchError(this.handleError));
  }

  downloadEvidenceFile(evidenceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/evidences/${evidenceId}/download`, {
      responseType: 'blob',
    }).pipe(catchError(this.handleError));
  }

  getFiles(projectId: string, folderId?: string | null): Observable<EvidenceDto[]> {
    let url = `${this.apiUrl}/evidences/projects/${projectId}/files`;
    if (folderId) {
      url += `?folderId=${folderId}`;
    }
    return this.http.get<EvidenceDto[]>(url)
      .pipe(catchError(this.handleError));
  }

  getStudentFilesByActivity(projectId: string): Observable<StudentFilesByActivityGroup[]> {
    const url = `${this.apiUrl}/evidences/projects/${projectId}/student-files-by-activity`;
    return this.http.get<StudentFilesByActivityGroup[]>(url).pipe(catchError(this.handleError));
  }

  // --- LOCKING API ---

  lockFile(evidenceId: string): Observable<LockResponse> {
    return this.http.post<LockResponse>(`${this.apiUrl}/evidences/${evidenceId}/lock`, {})
      .pipe(catchError(this.handleError));
  }

  unlockFile(evidenceId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/evidences/${evidenceId}/unlock`, {})
      .pipe(catchError(this.handleError));
  }

  saveContent(evidenceId: string, content: string): Observable<EvidenceDto> {
    return this.http.put<EvidenceDto>(`${this.apiUrl}/evidences/${evidenceId}/content`, { content })
      .pipe(catchError(this.handleError));
  }
}
