import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import type { TeacherDashboardData, TeacherDashboardItem } from '../../../../core/models/teacher.models';
import { TeacherService } from '../../data-access/teacher.service';
import type { TeacherThreadDetail } from '../../../../core/models/teacher.models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css'],
})
export class TeacherDashboardComponent implements OnInit {
  loading = false;
  errorMessage = '';
  dashboard: TeacherDashboardData | null = null;

  threadOpen = false;
  threadLoading = false;
  threadError = '';
  thread: TeacherThreadDetail | null = null;
  threadReplyDraft = '';

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.load();

    this.route.queryParamMap.subscribe((qp) => {
      const threadId = qp.get('thread');
      if (threadId) {
        this.openThread(threadId);
      } else {
        this.closeThread(false);
      }
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.teacherService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.dashboard = null;
        this.errorMessage =
          typeof err === 'string' ? err : err?.message || 'No se pudo cargar el Centro de Acción';
      },
    });
  }

  open(item: TeacherDashboardItem): void {
    if (!item?.deep_link) return;
    this.router.navigateByUrl(item.deep_link);
  }

  trackById(_: number, item: TeacherDashboardItem): string {
    return item.id;
  }

  openThread(threadId: string): void {
    if (!threadId) return;
    this.threadOpen = true;
    this.threadLoading = true;
    this.threadError = '';
    this.thread = null;
    this.threadReplyDraft = '';

    this.teacherService.getThread(threadId).subscribe({
      next: (res) => {
        this.thread = res.data;
        this.threadLoading = false;
      },
      error: (err: any) => {
        this.threadLoading = false;
        this.threadError = typeof err === 'string' ? err : err?.message || 'No se pudo cargar la duda';
      },
    });
  }

  closeThread(updateUrl = true): void {
    this.threadOpen = false;
    this.threadLoading = false;
    this.threadError = '';
    this.thread = null;
    this.threadReplyDraft = '';

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { thread: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  sendThreadReply(): void {
    const id = this.thread?.id;
    const message = this.threadReplyDraft.trim();
    if (!id || !message) return;

    this.threadLoading = true;
    this.threadError = '';
    this.teacherService.replyThread(id, message).subscribe({
      next: () => {
        this.threadLoading = false;
        this.load();
        this.closeThread();
      },
      error: (err: any) => {
        this.threadLoading = false;
        this.threadError = typeof err === 'string' ? err : err?.message || 'No se pudo enviar la respuesta';
      },
    });
  }
}
