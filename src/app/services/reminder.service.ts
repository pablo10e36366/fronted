import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Reminder {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    isCompleted: boolean;
    createdAt: string;
}

export interface CreateReminderDto {
    title: string;
    description?: string;
    dueDate?: string;
}

export interface UpdateReminderDto {
    title?: string;
    description?: string;
    dueDate?: string;
    isCompleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
    private apiUrl = `${environment.apiUrl}/reminders`;

    constructor(private http: HttpClient) { }

    getReminders(): Observable<Reminder[]> {
        return this.http.get<Reminder[]>(this.apiUrl);
    }

    getReminder(id: string): Observable<Reminder> {
        return this.http.get<Reminder>(`${this.apiUrl}/${id}`);
    }

    createReminder(dto: CreateReminderDto): Observable<Reminder> {
        return this.http.post<Reminder>(this.apiUrl, dto);
    }

    updateReminder(id: string, dto: UpdateReminderDto): Observable<Reminder> {
        return this.http.patch<Reminder>(`${this.apiUrl}/${id}`, dto);
    }

    deleteReminder(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    markComplete(id: string): Observable<Reminder> {
        return this.updateReminder(id, { isCompleted: true });
    }
}
