import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { CreateEvidenceDto, EvidenceDto } from '../models/project.models';

export interface CreateEvidenceFileDto {
  projectId: string;
  milestoneId?: string | null;
  parentId?: string | null;
  name?: string | null;
  file: File;
}

@Injectable({ providedIn: 'root' })
export class EvidenceApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createEvidence(projectId: string, data: CreateEvidenceDto): Observable<EvidenceDto> {
    return this.http.post<EvidenceDto>(`${this.apiUrl}/evidences`, {
      ...data,
      projectId,
    });
  }

  createFile(dto: CreateEvidenceFileDto): Observable<EvidenceDto> {
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

    return this.http.post<EvidenceDto>(`${this.apiUrl}/evidences/files`, formData);
  }
}
