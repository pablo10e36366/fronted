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
  loading = false;
  errorMessage = '';
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

    this.teacherService.getNotifications({ page: 1, page_size: 50 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.loginItems = items.filter((it) => it.type === 'login');
        this.submissionItems = items.filter((it) => it.type === 'student_submission');
        this.joinRequestItems = items.filter((it) => it.type === 'join_request');
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

  open(item: TeacherNotificationItem): void {
    if (!item?.deep_link) return;
    this.router.navigateByUrl(item.deep_link);
  }

  trackById(_: number, item: TeacherNotificationItem): string {
    return item.id;
  }
}
