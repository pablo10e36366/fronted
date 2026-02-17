import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { StudentService } from '../../data-access/student.service';
import type { StudentAssignmentListItem } from '../../../../core/models/student.models';
import type { AssignmentStatus } from '../../../../core/models/assignment.models';

type StatusFilter = 'all' | AssignmentStatus;

@Component({
  selector: 'app-student-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-deliveries.component.html',
  styleUrls: ['./student-deliveries.component.css'],
})
export class StudentDeliveriesComponent implements OnInit {
  loading = false;
  errorMessage = '';

  // Filters
  status: StatusFilter = 'PENDIENTE';
  selectedCourseId = '';
  q = '';
  sort: 'created_at_desc' | 'deadline_asc' = 'deadline_asc';

  page = 1;
  pageSize = 10;
  total = 0;

  items: StudentAssignmentListItem[] = [];

  courses: Array<{ id: string; name: string }> = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(private studentService: StudentService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadCoursesForFilter();

    // Keep URL-driven filters in sync (supports deep links from dashboard)
    let firstEmission = true;
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, qp]) => {
        const routeCourseId = params.get('courseId');
        const queryCourseId = qp.get('course_id');
        const nextCourseId = routeCourseId || queryCourseId || this.selectedCourseId || '';

        const nextStatus = qp.has('status') ? ((qp.get('status') as StatusFilter | null) || this.status) : this.status;
        const nextQ = qp.has('q') ? qp.get('q') || '' : this.q;
        const nextSort = qp.has('sort')
          ? ((qp.get('sort') as 'created_at_desc' | 'deadline_asc' | null) || this.sort)
          : this.sort;
        const nextPage = qp.has('page') ? Number(qp.get('page') || 1) || 1 : this.page;

        const changed =
          nextCourseId !== this.selectedCourseId ||
          nextStatus !== this.status ||
          nextQ !== this.q ||
          nextSort !== this.sort ||
          nextPage !== this.page;

        if (!changed && !firstEmission) return;
        firstEmission = false;

        this.selectedCourseId = nextCourseId;
        this.status = nextStatus;
        this.q = nextQ;
        this.sort = nextSort;
        this.page = Math.max(1, nextPage);

        this.load();
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.totalPages));
    if (nextPage === this.page) return;
    this.page = nextPage;
    this.load();
  }

  statusLabel(item: Pick<StudentAssignmentListItem, 'status' | 'review_outcome'>): string {
    if (item.review_outcome === 'CHANGES_REQUESTED') return 'Cambios solicitados';
    if (item.review_outcome === 'APPROVED') return 'Aprobado';

    switch (item.status) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ENTREGADO':
        return 'Entregado';
      case 'REVISADO':
        return 'Revisado';
      default:
        return item.status;
    }
  }

  private load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.studentService
      .getAssignments({
        status: this.status === 'all' ? undefined : this.status,
        course_id: this.selectedCourseId || undefined,
        q: this.q || undefined,
        sort: this.sort,
        page: this.page,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.items = res.data?.items || [];
          this.total = res.meta?.total || this.items.length;
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.items = [];
          this.total = 0;
          this.errorMessage =
            typeof err === 'string' ? err : err?.message || 'No se pudieron cargar tus entregas';
        },
      });
  }

  private loadCoursesForFilter(): void {
    // Small UX improvement: let the user pick a course by name (no manual ID copy)
    this.studentService
      .getCourses({ page: 1, page_size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = res.data?.items || [];
          this.courses = items.map((c) => ({ id: c.id, name: c.name || c.code || 'Curso' }));
        },
        error: () => {
          this.courses = [];
        },
      });
  }
}
