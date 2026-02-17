import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Evidence {
    id: string;
    projectId: string;
    milestoneId?: string;
    type: 'file' | 'folder';
    name: string;
    path: string;
    mimeType?: string;
    size?: number;
    lockedBy?: string;
    lockedAt?: Date;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFolderDto {
    projectId: string;
    milestoneId?: string;
    name: string;
    path: string;
}

export interface SaveContentDto {
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class EvidenceService {
    private readonly apiUrl = `${environment.apiUrl}/evidences`;

    constructor(private http: HttpClient) { }

    /**
     * Listar archivos/carpetas de un proyecto
     */
    listProjectFiles(projectId: string): Observable<Evidence[]> {
        return this.http.get<Evidence[]>(`${this.apiUrl}/projects/${projectId}/files`);
    }

    /**
     * Crear una carpeta
     */
    createFolder(dto: CreateFolderDto): Observable<Evidence> {
        return this.http.post<Evidence>(`${this.apiUrl}/folders`, dto);
    }

    /**
     * Obtener una evidencia por ID
     */
    getEvidence(id: string): Observable<Evidence> {
        return this.http.get<Evidence>(`${this.apiUrl}/${id}`);
    }

    /**
     * Listar evidencias por hito
     */
    getEvidencesByMilestone(milestoneId: string): Observable<Evidence[]> {
        return this.http.get<Evidence[]>(`${this.apiUrl}/milestone/${milestoneId}`);
    }

    /**
     * Adquirir lock para edición
     */
    acquireLock(id: string): Observable<Evidence> {
        return this.http.post<Evidence>(`${this.apiUrl}/${id}/lock`, {});
    }

    /**
     * Liberar lock
     */
    releaseLock(id: string): Observable<Evidence> {
        return this.http.post<Evidence>(`${this.apiUrl}/${id}/unlock`, {});
    }

    /**
     * Guardar contenido editado
     */
    saveContent(id: string, content: string): Observable<Evidence> {
        return this.http.put<Evidence>(`${this.apiUrl}/${id}/content`, { content });
    }

    /**
     * Revisar evidencia
     */
    reviewEvidence(id: string, status: 'approved' | 'rejected', comments?: string): Observable<Evidence> {
        return this.http.patch<Evidence>(`${this.apiUrl}/${id}/review`, { status, comments });
    }
}
