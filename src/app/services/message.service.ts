import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

export interface Message {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    threadId?: string | null;
    projectId: string;
    authorId: number;
    author?: {
        id: number;
        name: string;
        email: string;
    };
}

@Injectable({ providedIn: 'root' })
export class MessageService {
    createMessage(projectId: string, newMessage: string) {
        throw new Error('Method not implemented.');
    }
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private notificationService: NotificationService
    ) { }

    private handleError = (error: string | Error): Observable<never> => {
        const errorMessage = typeof error === 'string'
            ? error
            : error.message || 'Error en chat';

        console.error('Error en MessageService:', errorMessage);
        this.notificationService.showError(errorMessage);
        return throwError(() => errorMessage);
    };

    /**
     * Lista mensajes de un proyecto (paginado)
     */
    getMessages(projectId: string, limit = 50, offset = 0): Observable<Message[]> {
        return this.http.get<Message[]>(
            `${this.apiUrl}/projects/${projectId}/messages`,
            { params: { limit: limit.toString(), offset: offset.toString() } }
        ).pipe(catchError(this.handleError));
    }

    /**
     * Envía un nuevo mensaje
     */
    sendMessage(projectId: string, content: string, threadId?: string): Observable<Message> {
        return this.http.post<Message>(
            `${this.apiUrl}/projects/${projectId}/messages`,
            { content, threadId }
        ).pipe(catchError(this.handleError));
    }

    /**
     * Edita un mensaje existente
     */
    updateMessage(projectId: string, messageId: string, content: string): Observable<Message> {
        return this.http.put<Message>(
            `${this.apiUrl}/projects/${projectId}/messages/${messageId}`,
            { content }
        ).pipe(catchError(this.handleError));
    }

    /**
     * Elimina un mensaje
     */
    deleteMessage(projectId: string, messageId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/projects/${projectId}/messages/${messageId}`
        ).pipe(catchError(this.handleError));
    }

    /**
     * Obtiene respuestas de un hilo
     */
    getThreadReplies(projectId: string, threadId: string): Observable<Message[]> {
        return this.http.get<Message[]>(
            `${this.apiUrl}/projects/${projectId}/messages/threads/${threadId}`
        ).pipe(catchError(this.handleError));
    }
}
