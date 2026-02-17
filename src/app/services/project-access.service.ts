import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProjectPermission = 'VIEW' | 'EDIT';
export type AccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface ProjectAccessDto {
    id: string;
    projectId: string;
    userId: number;
    permission: ProjectPermission;
    status: AccessStatus;
    grantedBy?: { id: number; name: string; email: string };
    requestedAt: string;
    resolvedAt?: string;
    notes?: string;
    user?: { id: number; name: string; email: string };
    project?: {
        id: string;
        title: string;
        owner: { id: number; name: string; email: string };
    };
}

export interface RequestAccessDto {
    permission: ProjectPermission;
    notes?: string;
}

export interface RespondToRequestDto {
    action: 'APPROVED' | 'REJECTED';
    notes?: string;
}

export interface ChangePermissionDto {
    permission: ProjectPermission;
}

export interface PermissionCheckDto {
    canView: boolean;
    canEdit: boolean;
    permission?: ProjectAccessDto;
}

@Injectable({ providedIn: 'root' })
export class ProjectAccessService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Solicitar acceso a un proyecto
     */
    requestAccess(projectId: string, dto: RequestAccessDto): Observable<ProjectAccessDto> {
        return this.http.post<ProjectAccessDto>(`${this.apiUrl}/projects/${projectId}/access`, dto);
    }

    /**
     * Aprobar o rechazar una solicitud
     */
    respondToRequest(
        projectId: string,
        requestId: string,
        dto: RespondToRequestDto,
    ): Observable<ProjectAccessDto> {
        return this.http.patch<ProjectAccessDto>(
            `${this.apiUrl}/projects/${projectId}/access/${requestId}`,
            dto,
        );
    }

    /**
     * Cambiar tipo de permiso (VIEW <-> EDIT)
     */
    changePermission(
        projectId: string,
        requestId: string,
        dto: ChangePermissionDto,
    ): Observable<ProjectAccessDto> {
        return this.http.patch<ProjectAccessDto>(
            `${this.apiUrl}/projects/${projectId}/access/${requestId}/permission`,
            dto,
        );
    }

    /**
     * Revocar acceso de un usuario
     */
    revokeAccess(projectId: string, userId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/access/${userId}`);
    }

    /**
     * Obtener solicitudes/permisos de un proyecto
     */
    getProjectAccess(projectId: string, status?: AccessStatus): Observable<ProjectAccessDto[]> {
        let params = new HttpParams();
        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<ProjectAccessDto[]>(`${this.apiUrl}/projects/${projectId}/access`, {
            params,
        });
    }

    /**
     * Obtener mis solicitudes de acceso
     */
    getMyRequests(): Observable<ProjectAccessDto[]> {
        return this.http.get<ProjectAccessDto[]>(`${this.apiUrl}/my-access-requests`);
    }

    /**
     * Verificar mis permisos en un proyecto
     */
    checkMyPermission(projectId: string): Observable<PermissionCheckDto> {
        return this.http.get<PermissionCheckDto>(`${this.apiUrl}/projects/${projectId}/my-permission`);
    }
}
