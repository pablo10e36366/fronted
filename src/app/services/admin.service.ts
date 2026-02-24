import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    name: string;
    email: string;
    role: { id: number; name: string } | null;
    isActive: boolean;
    lastAccess?: string;
    blockedAt?: Date;
    blockedBy?: number;
}

export interface AdminRole {
    id: number;
    name: string;
}

export interface SystemSettings {
    id: number;
    storageLimit: number; // MB
    allowedFileTypes: string;
    maxReviewDays: number;
    auditLogsEnabled: boolean;
}

export interface AdminDashboardAlert {
    id: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
    count: number;
    priority: number;
}

export interface AdminDashboardStats {
    kpis: {
        activeUsers: number;
        activeProjects: number;
        inReview: number;
        storageUsed: number;
    };
    projectStats: {
        draft: number;
        inProgress: number;
        inReview?: number;
        completed: number;
    };
    alerts: AdminDashboardAlert[];
}

export type RoleUpgradeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RoleUpgradeRequestItem {
    id: string;
    userId: number;
    requestedRole: string;
    message: string | null;
    status: RoleUpgradeRequestStatus;
    adminNote: string | null;
    reviewedByUserId: number | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        name?: string | null;
        email?: string | null;
    } | null;
}

export interface RoleUpgradeRequestListResponse {
    items: RoleUpgradeRequestItem[];
    total: number;
    page: number;
    page_size: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly apiUrl = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

    private shouldUseReadFallback(error: HttpErrorResponse): boolean {
        if (error.status === 401 || error.status === 403) return false;
        return error.status === 0 || error.status === 400 || error.status === 404 || error.status >= 500;
    }

    private emptyDashboardStats(): AdminDashboardStats {
        return {
            kpis: {
                activeUsers: 0,
                activeProjects: 0,
                inReview: 0,
                storageUsed: 0,
            },
            projectStats: {
                draft: 0,
                inProgress: 0,
                inReview: 0,
                completed: 0,
            },
            alerts: [],
        };
    }

    private defaultSystemSettings(): SystemSettings {
        return {
            id: 0,
            storageLimit: 5120,
            allowedFileTypes: 'pdf,doc,docx,png,jpg,jpeg,zip',
            maxReviewDays: 15,
            auditLogsEnabled: true,
        };
    }

    private pickField(raw: Record<string, unknown>, keys: string[]): unknown {
        for (const key of keys) {
            if (raw[key] !== undefined && raw[key] !== null) return raw[key];
        }
        return undefined;
    }

    private parseNumber(value: unknown, fallback: number): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private parseBoolean(value: unknown, fallback: boolean): boolean {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true' || normalized === '1') return true;
            if (normalized === 'false' || normalized === '0') return false;
        }
        if (typeof value === 'number') return value !== 0;
        return fallback;
    }

    private parseString(value: unknown, fallback: string): string {
        if (typeof value === 'string' && value.trim()) return value;
        return fallback;
    }

    private normalizeSystemSettings(payload: unknown): SystemSettings {
        const defaults = this.defaultSystemSettings();
        const raw = payload && typeof payload === 'object'
            ? (payload as Record<string, unknown>)
            : {};

        const id = this.parseNumber(this.pickField(raw, ['id']), defaults.id);
        const storageLimit = this.parseNumber(
            this.pickField(raw, ['storageLimit', 'storage_limit']),
            defaults.storageLimit,
        );
        const allowedFileTypes = this.parseString(
            this.pickField(raw, ['allowedFileTypes', 'allowed_file_types']),
            defaults.allowedFileTypes,
        );
        const maxReviewDays = this.parseNumber(
            this.pickField(raw, ['maxReviewDays', 'max_review_days']),
            defaults.maxReviewDays,
        );
        const auditLogsEnabled = this.parseBoolean(
            this.pickField(raw, ['auditLogsEnabled', 'audit_logs_enabled']),
            defaults.auditLogsEnabled,
        );

        return {
            id,
            storageLimit,
            allowedFileTypes,
            maxReviewDays,
            auditLogsEnabled,
        };
    }

    // --- USERS ---

    getUsers(status?: 'active' | 'blocked', roleId?: number, search?: string): Observable<User[]> {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        if (roleId) params = params.set('roleId', roleId);
        if (search) params = params.set('search', search);

        return this.http.get<User[]>(`${this.apiUrl}/users`, { params });
    }

    getRoles(): Observable<AdminRole[]> {
        return this.http.get<AdminRole[]>(`${this.apiUrl}/roles`);
    }

    createUser(user: { name: string; email: string; password: string; roleId: number }): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/users`, user);
    }

    changeUserRole(userId: number, roleId: number): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/users/${userId}/role`, { roleId });
    }

    blockUser(userId: number, isActive: boolean): Observable<User> {
        // If we want to "block", we send isActive: false. To "unblock", isActive: true.
        return this.http.patch<User>(`${this.apiUrl}/users/${userId}/block`, { isActive });
    }

    // --- SETTINGS ---

    getSettings(): Observable<SystemSettings> {
        return this.http.get<unknown>(`${this.apiUrl}/settings`).pipe(
            map((response) => this.normalizeSystemSettings(response)),
            catchError((error: HttpErrorResponse) => {
                if (!this.shouldUseReadFallback(error)) {
                    return throwError(() => error);
                }
                return of(this.defaultSystemSettings());
            }),
        );
    }

    updateSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
        const normalized = this.normalizeSystemSettings(settings);
        const payload = {
            storageLimit: normalized.storageLimit,
            allowedFileTypes: normalized.allowedFileTypes,
            maxReviewDays: normalized.maxReviewDays,
            auditLogsEnabled: normalized.auditLogsEnabled,
            storage_limit: normalized.storageLimit,
            allowed_file_types: normalized.allowedFileTypes,
            max_review_days: normalized.maxReviewDays,
            audit_logs_enabled: normalized.auditLogsEnabled,
        };

        return this.http.patch<unknown>(`${this.apiUrl}/settings`, payload).pipe(
            map((response) => this.normalizeSystemSettings(response ?? normalized)),
            catchError((error: HttpErrorResponse) => {
                if (!this.shouldUseReadFallback(error)) {
                    return throwError(() => error);
                }
                return of(normalized);
            }),
        );
    }

    // --- DASHBOARD ---

    getDashboardStats(): Observable<AdminDashboardStats> {
        return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard-stats`).pipe(
            catchError((error: HttpErrorResponse) => {
                if (!this.shouldUseReadFallback(error)) {
                    return throwError(() => error);
                }

                return of(this.emptyDashboardStats());
            }),
        );
    }

    // --- ROLE UPGRADE REQUESTS ---

    getRoleUpgradeRequests(filters?: {
        status?: RoleUpgradeRequestStatus;
        search?: string;
        page?: number;
        pageSize?: number;
    }): Observable<RoleUpgradeRequestListResponse> {
        let params = new HttpParams();
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.page) params = params.set('page', String(filters.page));
        if (filters?.pageSize) params = params.set('page_size', String(filters.pageSize));

        return this.http.get<RoleUpgradeRequestListResponse>(`${this.apiUrl}/role-upgrade-requests`, { params });
    }

    resolveRoleUpgradeRequest(
        requestId: string,
        decision: 'APPROVE' | 'REJECT',
        notes?: string
    ): Observable<RoleUpgradeRequestItem> {
        return this.http.patch<RoleUpgradeRequestItem>(`${this.apiUrl}/role-upgrade-requests/${requestId}`, {
            decision,
            notes: notes || undefined,
        });
    }
}
