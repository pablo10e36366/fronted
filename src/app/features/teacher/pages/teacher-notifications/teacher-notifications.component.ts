import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import type { TeacherNotificationItem } from '../../../../core/models/teacher.models';
import { NOTIFICATIONS_LAST_SEEN_KEYS } from '../../../../core/notifications/notifications.constants';
import { TeacherService } from '../../data-access/teacher.service';

@Component({
  selector: 'app-teacher-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-notifications.component.html',
  styleUrls: ['./teacher-notifications.component.css'],
})
export class TeacherNotificationsComponent implements OnInit {
  private readonly clearedAtKey = 'pm_teacher_notifications_cleared_at';

  loading = false;
  errorMessage = '';
  successMessage = '';
  loginItems: TeacherNotificationItem[] = [];
  submissionItems: TeacherNotificationItem[] = [];
  joinRequestItems: TeacherNotificationItem[] = [];

  constructor(private teacherService: TeacherService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.teacherService.getNotifications({ page: 1, page_size: 50 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        const clearedAt = this.getClearedAtMs();
        const visibleItems =
          clearedAt > 0
            ? items.filter((it) => new Date(it.created_at).getTime() > clearedAt)
            : items;
        this.loginItems = visibleItems.filter((it) => it.type === 'login');
        this.submissionItems = visibleItems.filter((it) => it.type === 'student_submission');
        this.joinRequestItems = visibleItems.filter((it) => it.type === 'join_request');
        this.loading = false;

        sessionStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEYS.teacher, new Date().toISOString());
      },
      error: (err: any) => {
        this.loading = false;
        this.loginItems = [];
        this.submissionItems = [];
        this.joinRequestItems = [];
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
    sessionStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEYS.teacher, nowIso);

    this.loginItems = [];
    this.submissionItems = [];
    this.joinRequestItems = [];
    this.errorMessage = '';
    this.successMessage = 'Notificaciones limpiadas.';
  }

  get hasNotifications(): boolean {
    return this.loginItems.length + this.submissionItems.length + this.joinRequestItems.length > 0;
  }

  private getClearedAtMs(): number {
    const raw = sessionStorage.getItem(this.clearedAtKey);
    if (!raw) return 0;
    const timestamp = new Date(raw).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  open(item: TeacherNotificationItem): void {
    if (!item?.deep_link) return;
    this.router.navigateByUrl(item.deep_link);
  }

  trackById(_: number, item: TeacherNotificationItem): string {
    return item.id;
  }
}
