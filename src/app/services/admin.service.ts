import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly apiUrl = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

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
        return this.http.get<SystemSettings>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
        return this.http.patch<SystemSettings>(`${this.apiUrl}/settings`, settings);
    }

    // --- DASHBOARD ---

    getDashboardStats(): Observable<AdminDashboardStats> {
        return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard-stats`);
    }
}
