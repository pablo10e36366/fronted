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
  loading = false;
  errorMessage = '';

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

    this.studentService.getNotifications({ page: 1, page_size: 50 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.loginItems = items.filter((it) => it.type === 'login');
        this.teacherUploadItems = items.filter((it) => it.type === 'teacher_upload');
        this.deliveryItems = items.filter((it) => it.type === 'delivery_success');
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
}
