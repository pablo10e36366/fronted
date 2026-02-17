import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
    id: string;
    projectId: string;
    reviewerId: string;
    reviewer?: {
        id: string;
        name: string;
        email: string;
    };
    rating: number;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateReviewDto {
    rating: number;
    comments?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private readonly apiUrl = `${environment.apiUrl}/projects`;

    constructor(private http: HttpClient) { }

    /**
     * Crear una revisión para un proyecto
     */
    createReview(projectId: string, dto: CreateReviewDto): Observable<Review> {
        return this.http.post<Review>(`${this.apiUrl}/${projectId}/reviews`, dto);
    }

    /**
     * Listar todas las revisiones de un proyecto
     */
    getProjectReviews(projectId: string): Observable<Review[]> {
        return this.http.get<Review[]>(`${this.apiUrl}/${projectId}/reviews`);
    }
}
