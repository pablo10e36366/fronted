import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Milestone {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    dueDate?: Date;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMilestoneDto {
    projectId: string;
    title: string;
    description?: string;
    dueDate?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class MilestoneService {
    private readonly apiUrl = `${environment.apiUrl}/milestones`;

    constructor(private http: HttpClient) { }

    /**
     * Crear un nuevo hito
     */
    createMilestone(dto: CreateMilestoneDto): Observable<Milestone> {
        return this.http.post<Milestone>(this.apiUrl, dto);
    }

    /**
     * Listar todos los hitos de un proyecto
     */
    getMilestonesByProject(projectId: string): Observable<Milestone[]> {
        return this.http.get<Milestone[]>(`${this.apiUrl}/project/${projectId}`);
    }

    /**
     * Obtener un hito específico por ID
     */
    getMilestone(id: string): Observable<Milestone> {
        return this.http.get<Milestone>(`${this.apiUrl}/${id}`);
    }

    /**
     * Actualizar un hito
     */
    updateMilestone(id: string, updates: Partial<Milestone>): Observable<Milestone> {
        return this.http.patch<Milestone>(`${this.apiUrl}/${id}`, updates);
    }

    /**
     * Eliminar un hito
     */
    deleteMilestone(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
