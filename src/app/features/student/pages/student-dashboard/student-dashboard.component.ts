import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StudentService } from '../../data-access/student.service';
import type { StudentTaskListItem } from '../../../../core/models/student.models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css'],
})
export class StudentDashboardComponent implements OnInit {
  loading = false;
  errorMessage = '';

  pendingTotal = 0;
  overdueTotal = 0;
  pendingItems: StudentTaskListItem[] = [];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.studentService
      .getDashboard()
      .subscribe({
        next: (res) => {
          const pending = res.data?.pending_items || [];
          const overdue = res.data?.overdue_items || [];

          this.pendingItems = [...overdue, ...pending].sort((a, b) => {
            const da = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
            const db = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
            return da - db;
          });
          this.pendingTotal = res.data?.pending_total ?? pending.length;
          this.overdueTotal = res.data?.overdue_total ?? overdue.length;
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.pendingItems = [];
          this.pendingTotal = 0;
          this.overdueTotal = 0;
          this.errorMessage =
            typeof err === 'string' ? err : err?.message || 'No se pudo cargar tu Centro de Acción';
        },
      });
  }

  statusLabel(status: StudentTaskListItem['status']): string {
    switch (status) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ENTREGADO':
        return 'Entregado';
      case 'REVISADO':
        return 'Revisado';
      default:
        return status;
    }
  }

  itemStatusLabel(item: StudentTaskListItem): string {
    const now = Date.now();
    if (item.due_at && new Date(item.due_at).getTime() < now) return 'Atrasada';
    return this.statusLabel(item.status);
  }
}
