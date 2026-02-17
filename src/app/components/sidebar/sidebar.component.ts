import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, forkJoin, switchMap, timer } from 'rxjs';

import type { TeacherBadges } from '../../core/models/teacher.models';
import type { StudentDashboardData, StudentNotificationItem } from '../../core/models/student.models';
import type { TeacherNotificationItem } from '../../core/models/teacher.models';
import { TeacherService } from '../../features/teacher/data-access/teacher.service';
import { StudentService } from '../../features/student/data-access/student.service';
import { NOTIFICATIONS_LAST_SEEN_KEYS } from '../../core/notifications/notifications.constants';
import { SessionService } from '../../core/auth/data-access/session.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  badges: TeacherBadges | null = null;
  studentDashboard: StudentDashboardData | null = null;
  unreadNotificationsCount = 0;

  private sub?: Subscription;

  constructor(
    private teacherService: TeacherService,
    private studentService: StudentService,
    private SessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const role = String(this.SessionService.getRole() || '').toLowerCase();
    if (role === 'docente') {
      this.badges = null;
      this.studentDashboard = null;
      this.unreadNotificationsCount = 0;
      this.sub = timer(0, 30_000)
        .pipe(
          switchMap(() =>
            forkJoin({
              badges: this.teacherService.getBadges(),
              notifications: this.teacherService.getNotifications({ page: 1, page_size: 50 }),
            }),
          ),
        )
        .subscribe({
          next: ({ badges, notifications }) => {
            this.badges = badges.data;
            const items = (notifications.data?.items || []) as TeacherNotificationItem[];
            this.unreadNotificationsCount = this.computeUnreadCount(
              items,
              NOTIFICATIONS_LAST_SEEN_KEYS.teacher,
            );
          },
          error: () => {},
        });
      return;
    }

    if (role === 'colaborador') {
      this.badges = null;
      this.studentDashboard = null;
      this.unreadNotificationsCount = 0;
      this.sub = timer(0, 30_000)
        .pipe(
          switchMap(() =>
            forkJoin({
              dashboard: this.studentService.getDashboard(),
              notifications: this.studentService.getNotifications({ page: 1, page_size: 50 }),
            }),
          ),
        )
        .subscribe({
          next: ({ dashboard, notifications }) => {
            this.studentDashboard = dashboard.data || null;
            const items = (notifications.data?.items || []) as StudentNotificationItem[];
            this.unreadNotificationsCount = this.computeUnreadCount(
              items,
              NOTIFICATIONS_LAST_SEEN_KEYS.student,
            );
          },
          error: () => {},
        });
      return;
    }

    this.badges = null;
    this.studentDashboard = null;
    this.unreadNotificationsCount = 0;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get inicioBadgeCount(): number {
    const role = String(this.SessionService.getRole() || '').toLowerCase();
    if (role === 'colaborador') {
      const pending = this.studentDashboard?.pending_total ?? 0;
      const overdue = this.studentDashboard?.overdue_total ?? 0;
      return Math.max(0, pending + overdue);
    }
    return (this.badges?.alerts || 0) + (this.badges?.threads_unanswered || 0);
  }

  get notificationsBadgeCount(): number {
    return this.unreadNotificationsCount || 0;
  }

  get deliveriesLabel(): string {
    const role = String(this.SessionService.getRole() || '').toLowerCase();
    return role === 'colaborador' ? 'Pendientes' : 'Entregas';
  }

  private computeUnreadCount(
    items: Array<{ created_at: string }>,
    storageKey: string,
  ): number {
    const lastSeenRaw = sessionStorage.getItem(storageKey);
    if (!lastSeenRaw) return items.length;
    const lastSeen = new Date(lastSeenRaw).getTime();
    if (!Number.isFinite(lastSeen)) return items.length;
    return items.filter((it) => new Date(it.created_at).getTime() > lastSeen).length;
  }
}

