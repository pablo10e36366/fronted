import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, Subject, takeUntil, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TimelineFilters {
    userId?: number;
    projectId?: string;
    action?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface Activity {
    id: number;
    action: string; // Simplificado a string para flexibilidad, o enum completo
    metadata: any;
    createdAt: string;
    reactions: Record<string, number[]>;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface ReactionToggleResult {
    action: 'added' | 'removed';
    activity: Activity;
}

@Injectable({ providedIn: 'root' })
export class ActivityService implements OnDestroy {
    private apiUrl = environment.apiUrl;
    private stopPolling$ = new Subject<void>();
    private lastCheck?: string;

    constructor(private http: HttpClient) { }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    /**
     * Obtiene línea de tiempo filtrada
     */
    getTimeline(filters: TimelineFilters): Observable<{ data: Activity[], total: number }> {
        let params = new HttpParams();
        if (filters.userId) params = params.set('userId', filters.userId);
        if (filters.projectId) params = params.set('projectId', filters.projectId);
        if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
        if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
        if (filters.limit) params = params.set('limit', filters.limit);
        if (filters.offset) params = params.set('offset', filters.offset);

        // Handle array of actions
        if (filters.action && filters.action.length > 0) {
            filters.action.forEach(a => params = params.append('action', a));
        }

        return this.http.get<{ data: Activity[], total: number }>(`${this.apiUrl}/activities/timeline`, { params });
    }

    // ... (rest of methods)

    // Helper text update
    getActionText(action: string): string {
        const actionMap: Record<string, string> = {
            'SUBMIT_EVIDENCE': 'subió una evidencia',
            'REVIEW_EVIDENCE': 'revisó una evidencia',
            'PROJECT_CREATE': 'creó un proyecto',
            'PROJECT_STATUS_CHANGE': 'cambió estado',
            'PROJECT_UPDATE': 'actualizó detalles',
            'PROJECT_DELETE': 'eliminó proyecto',
            'PROJECT_ARCHIVE': 'archivó proyecto',
            'PROJECT_DEADLINE_CHANGE': 'cambió deadline',
            'FILE_UPLOAD': 'subió archivo',
            'FILE_VERSION_NEW': 'nueva versión',
            'FILE_RESTORE': 'restauró versión',
            'FILE_DELETE': 'eliminó archivo',
            'COMMENT_ADD': 'comentó',
            'REVIEW_REQUEST': 'solicitó revisión',
            'REVIEW_RESOLVE': 'resolvió revisión',
            'USER_ASSIGN': 'asignó usuario',
            'USER_ROLE_CHANGE': 'cambió rol',
            'MESSAGE_SENT': 'mensaje chat',
        };
        return actionMap[action] || action;
    }

    getActionIcon(action: string): string {
        const iconMap: Record<string, string> = {
            'SUBMIT_EVIDENCE': '📤',
            'REVIEW_EVIDENCE': '👀',
            'PROJECT_CREATE': '✨',
            'PROJECT_STATUS_CHANGE': '🔄',
            'PROJECT_UPDATE': '✏️',
            'PROJECT_DELETE': '🗑️',
            'PROJECT_ARCHIVE': '📦',
            'PROJECT_DEADLINE_CHANGE': '⏰',
            'FILE_UPLOAD': '📎',
            'FILE_VERSION_NEW': '📑',
            'FILE_RESTORE': '⏪',
            'FILE_DELETE': '❌',
            'COMMENT_ADD': '💬',
            'REVIEW_REQUEST': '🙋',
            'REVIEW_RESOLVE': '✅',
            'USER_ASSIGN': '👤',
            'USER_ROLE_CHANGE': '🛡️',
            'MESSAGE_SENT': '📨',
        };
        return iconMap[action] || '📌';
    }

    /**
     * Obtiene actividades recientes con polling (Legacy/Widget)
     */
    getActivitiesWithPolling(pollingInterval = 10000): Observable<Activity[]> {
        return interval(pollingInterval).pipe(
            startWith(0),
            switchMap(() => this.getActivities().pipe(
                catchError(err => {
                    console.warn('Activity polling error:', err);
                    return of([]);
                })
            )),
            takeUntil(this.stopPolling$)
        );
    }

    getActivities(since?: string): Observable<Activity[]> {
        let params = new HttpParams();
        if (since || this.lastCheck) {
            params = params.set('since', since || this.lastCheck || '');
        }
        return this.http.get<Activity[]>(`${this.apiUrl}/activities`, { params });
    }

    stopPolling(): void {
        this.stopPolling$.next();
    }

    updateLastCheck(): void {
        this.lastCheck = new Date().toISOString();
    }

    getGlobalFeed(limit = 50, offset = 0): Observable<Activity[]> {
        let params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());
        return this.http.get<Activity[]>(`${this.apiUrl}/activities/feed`, { params }).pipe(
            catchError(err => of([]))
        );
    }

    toggleReaction(activityId: number, emoji: string): Observable<ReactionToggleResult> {
        return this.http.post<ReactionToggleResult>(
            `${this.apiUrl}/activities/${activityId}/reactions`,
            { emoji }
        );
    }
}
