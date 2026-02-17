import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

export interface Version {
    id: string;
    content: string;
    title?: string;
    changeDescription?: string;
    createdAt: Date;
    evidenceId: string;
    authorId: number;
    author?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface VersionComparison {
    version1: Version;
    version2: Version;
    diff: {
        added: string[];
        removed: string[];
    };
}

@Injectable({ providedIn: 'root' })
export class VersionService {
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private notificationService: NotificationService
    ) { }

    private handleError = (error: string | Error): Observable<never> => {
        const errorMessage = typeof error === 'string'
            ? error
            : error.message || 'Error en versionado';

        console.error('Error en VersionService:', errorMessage);
        this.notificationService.showError(errorMessage);
        return throwError(() => errorMessage);
    };

    /**
     * Lista todas las versiones de una evidencia
     */
    getVersions(evidenceId: string): Observable<Version[]> {
        return this.http.get<Version[]>(
            `${this.apiUrl}/evidences/${evidenceId}/versions`
        ).pipe(catchError(this.handleError));
    }

    /**
     * Crea un snapshot manual de la versión actual
     */
    createVersion(evidenceId: string, changeDescription?: string): Observable<Version> {
        return this.http.post<Version>(
            `${this.apiUrl}/evidences/${evidenceId}/versions`,
            { changeDescription }
        ).pipe(catchError(this.handleError));
    }

    /**
     * Obtiene una versión específica
     */
    getVersion(evidenceId: string, versionId: string): Observable<Version> {
        return this.http.get<Version>(
            `${this.apiUrl}/evidences/${evidenceId}/versions/${versionId}`
        ).pipe(catchError(this.handleError));
    }

    /**
     * Restaura una versión anterior
     */
    restoreVersion(evidenceId: string, versionId: string): Observable<Version> {
        return this.http.post<Version>(
            `${this.apiUrl}/evidences/${evidenceId}/versions/${versionId}/restore`,
            {}
        ).pipe(catchError(this.handleError));
    }

    /**
     * Compara dos versiones
     */
    compareVersions(evidenceId: string, versionId1: string, versionId2: string): Observable<VersionComparison> {
        return this.http.get<VersionComparison>(
            `${this.apiUrl}/evidences/${evidenceId}/versions/compare/${versionId1}/${versionId2}`
        ).pipe(catchError(this.handleError));
    }
}
