import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { StudentService } from '../../data-access/student.service';
import type { StudentAssignmentListItem } from '../../../../core/models/student.models';

type ReviewFilter = 'all' | 'approved' | 'changes_requested' | 'pending';

type GradeRow = {
  item: StudentAssignmentListItem;
  grade: number | null;
  feedbackText: string;
  reviewLabel: string;
};

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-grades.component.html',
  styleUrls: ['./student-grades.component.css'],
})
export class StudentGradesComponent implements OnInit {
  loading = false;
  errorMessage = '';

  q = '';
  selectedCourseId = '';
  reviewFilter: ReviewFilter = 'all';

  courses: Array<{ id: string; name: string }> = [];
  rows: GradeRow[] = [];
  filteredRows: GradeRow[] = [];

  averageGrade = 0;
  gradedCount = 0;
  approvedCount = 0;
  changesRequestedCount = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadGrades();
  }

  applyFilters(): void {
    const term = this.q.trim().toLowerCase();
    this.filteredRows = this.rows.filter((row) => {
      const reviewMatches =
        this.reviewFilter === 'all' ||
        (this.reviewFilter === 'approved' && row.item.review_outcome === 'APPROVED') ||
        (this.reviewFilter === 'changes_requested' &&
          row.item.review_outcome === 'CHANGES_REQUESTED') ||
        (this.reviewFilter === 'pending' && !row.item.review_outcome);

      const courseMatches =
        !this.selectedCourseId || row.item.course_id === this.selectedCourseId;

      const textMatches =
        !term ||
        (row.item.course_name || '').toLowerCase().includes(term) ||
        (row.item.milestone_title || '').toLowerCase().includes(term) ||
        (row.item.evidence_title || '').toLowerCase().includes(term) ||
        row.feedbackText.toLowerCase().includes(term);

      return reviewMatches && courseMatches && textMatches;
    });
  }

  private loadGrades(): void {
    this.loading = true;
    this.errorMessage = '';

    this.studentService
      .getAssignments({
        page: 1,
        page_size: 100,
        sort: 'created_at_desc',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = res.data?.items || [];
          this.rows = items.map((item) => this.toGradeRow(item));
          this.updateSummary();
          this.applyFilters();
          this.loading = false;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.rows = [];
          this.filteredRows = [];
          this.averageGrade = 0;
          this.gradedCount = 0;
          this.approvedCount = 0;
          this.changesRequestedCount = 0;
          const maybeHttp = err as { status?: number; message?: string };
          if (maybeHttp?.status === 400) {
            this.errorMessage = 'No se pudieron cargar las calificaciones por un parametro invalido.';
            return;
          }
          this.errorMessage =
            typeof err === 'string'
              ? err
              : maybeHttp?.message || 'No se pudieron cargar las calificaciones';
        },
      });
  }

  private loadCourses(): void {
    this.studentService
      .getCourses({ page: 1, page_size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = res.data?.items || [];
          this.courses = items.map((course) => ({
            id: course.id,
            name: course.name || course.code || 'Curso',
          }));
        },
        error: () => {
          this.courses = [];
        },
      });
  }

  private toGradeRow(item: StudentAssignmentListItem): GradeRow {
    const feedbackRaw = String(item.feedback || '').trim();
    const gradeMatch = feedbackRaw.match(
      /calificaci(?:o|ó)n\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i,
    );

    let grade: number | null = null;
    if (gradeMatch?.[1]) {
      const normalized = gradeMatch[1].replace(',', '.');
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) {
        grade = Math.round(parsed * 100) / 100;
      }
    }

    const feedbackText = feedbackRaw
      .replace(/^\s*calificaci(?:o|ó)n\s*:\s*[0-9]+(?:[.,][0-9]+)?\s*/i, '')
      .trim();

    return {
      item,
      grade,
      feedbackText,
      reviewLabel: this.getReviewLabel(item),
    };
  }

  private getReviewLabel(item: StudentAssignmentListItem): string {
    if (item.review_outcome === 'APPROVED') return 'Aprobado';
    if (item.review_outcome === 'CHANGES_REQUESTED') return 'Cambios solicitados';
    return item.status === 'REVISADO' ? 'Revisado' : 'Pendiente';
  }

  private updateSummary(): void {
    const gradedRows = this.rows.filter((row) => row.grade !== null);
    this.gradedCount = gradedRows.length;
    this.averageGrade = gradedRows.length
      ? Math.round(
          (gradedRows.reduce((acc, row) => acc + (row.grade || 0), 0) / gradedRows.length) * 100,
        ) / 100
      : 0;

    this.approvedCount = this.rows.filter((row) => row.item.review_outcome === 'APPROVED').length;
    this.changesRequestedCount = this.rows.filter(
      (row) => row.item.review_outcome === 'CHANGES_REQUESTED',
    ).length;
  }
}
