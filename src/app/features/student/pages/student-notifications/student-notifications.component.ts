import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StudentService } from '../../data-access/student.service';
import type { StudentNotificationItem } from '../../../../core/models/student.models';
import { NOTIFICATIONS_LAST_SEEN_KEYS } from '../../../../core/notifications/notifications.constants';

@Component({
  selector: 'app-student-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-notifications.component.html',
  styleUrls: ['./student-notifications.component.css'],
})
export class StudentNotificationsComponent implements OnInit {
  private readonly clearedAtKey = 'pm_student_notifications_cleared_at';

  loading = false;
  errorMessage = '';
  successMessage = '';

  loginItems: StudentNotificationItem[] = [];
  teacherUploadItems: StudentNotificationItem[] = [];
  deliveryItems: StudentNotificationItem[] = [];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentService.getNotifications({ page: 1, page_size: 50 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        const clearedAt = this.getClearedAtMs();
        const visibleItems =
          clearedAt > 0
            ? items.filter((it) => new Date(it.created_at).getTime() > clearedAt)
            : items;

        this.loginItems = visibleItems.filter((it) => it.type === 'login');
        this.teacherUploadItems = visibleItems.filter((it) => it.type === 'teacher_upload');
        this.deliveryItems = visibleItems.filter((it) => it.type === 'delivery_success');
        this.loading = false;

        sessionStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEYS.student, new Date().toISOString());
      },
      error: (err: any) => {
        this.loading = false;
        this.loginItems = [];
        this.teacherUploadItems = [];
        this.deliveryItems = [];
        this.errorMessage =
          typeof err === 'string' ? err : err?.message || 'No se pudieron cargar las notificaciones';
      },
    });
  }

  clearNotifications(): void {
    if (!this.hasNotifications) return;

    const shouldClear = confirm('¿Limpiar todas las notificaciones visibles?');
    if (!shouldClear) return;

    const nowIso = new Date().toISOString();
    sessionStorage.setItem(this.clearedAtKey, nowIso);
    sessionStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEYS.student, nowIso);

    this.loginItems = [];
    this.teacherUploadItems = [];
    this.deliveryItems = [];
    this.errorMessage = '';
    this.successMessage = 'Notificaciones limpiadas.';
  }

  get hasNotifications(): boolean {
    return this.loginItems.length + this.teacherUploadItems.length + this.deliveryItems.length > 0;
  }

  private getClearedAtMs(): number {
    const raw = sessionStorage.getItem(this.clearedAtKey);
    if (!raw) return 0;
    const timestamp = new Date(raw).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
}
