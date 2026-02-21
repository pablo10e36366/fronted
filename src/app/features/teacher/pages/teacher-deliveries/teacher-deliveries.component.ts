import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Subject,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import type {
  TeacherCourse,
  TeacherSubmissionDetail,
  TeacherSubmissionListItem,
} from '../../../../core/models/teacher.models';
import { TeacherService } from '../../data-access/teacher.service';

type StatusFilter = 'pending' | 'approved' | 'changes_requested' | 'all';
type DeliverySuggestion = {
  id: string;
  query: string;
  title: string;
  subtitle: string;
  courseId: string;
  source: 'submission' | 'activity';
  status: 'pending' | 'approved' | 'changes_requested';
};

@Component({
  selector: 'app-teacher-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-deliveries.component.html',
  styleUrls: ['./teacher-deliveries.component.css'],
})
export class TeacherDeliveriesComponent implements OnInit, OnDestroy {
  loading = false;
  errorMessage = '';

  courses: TeacherCourse[] = [];
  coursesLoading = false;

  // Filters
  status: StatusFilter = 'pending';
  selectedCourseId = '';
  q = '';
  sort: 'priority_desc' | 'created_at_desc' = 'priority_desc';
  suggestions: DeliverySuggestion[] = [];
  suggestionsLoading = false;
  showSuggestions = false;
  private hasSearchFocus = false;

  page = 1;
  pageSize = 10;
  total = 0;

  submissions: TeacherSubmissionListItem[] = [];

  // Detail modal
  detailOpen = false;
  detailLoading = false;
  detailError = '';
  detail: TeacherSubmissionDetail | null = null;
  feedbackDraft = '';

  private sub?: Subscription;
  private queryParamSub?: Subscription;
  private searchSub?: Subscription;
  private searchTerms$ = new Subject<string>();

  constructor(
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.setupSearchSuggestions();

    this.sub = this.route.paramMap.subscribe((params) => {
      const courseId = params.get('courseId');
      if (courseId) this.selectedCourseId = courseId;
      this.page = 1;
      this.loadSubmissions();
    });

    // Open detail via query param (?open=...)
    this.queryParamSub = this.route.queryParamMap.subscribe((qp) => {
      const openId = qp.get('open');
      if (openId) {
        this.openSubmission(openId);
      } else {
        this.closeDetail(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  applyFilters(): void {
    this.showSuggestions = false;
    this.page = 1;
    this.loadSubmissions();
  }

  onSearchInput(value: string): void {
    this.q = value;
    this.searchTerms$.next(value);
  }

  onSearchFocus(): void {
    this.hasSearchFocus = true;
    if (this.q.trim().length >= 2) {
      this.searchTerms$.next(this.q);
    }
  }

  onSearchBlur(): void {
    this.hasSearchFocus = false;
    setTimeout(() => {
      this.showSuggestions = false;
    }, 120);
  }

  selectSuggestion(suggestion: DeliverySuggestion): void {
    if (suggestion.source === 'activity') {
      this.showSuggestions = false;
      this.router.navigate(['/projects', suggestion.courseId]);
      return;
    }

    this.q = suggestion.query;
    this.showSuggestions = false;
    this.applyFilters();
  }

  goToPage(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.totalPages));
    if (nextPage === this.page) return;
    this.page = nextPage;
    this.loadSubmissions();
  }

  openSubmission(id: string): void {
    if (!id) return;

    this.detailOpen = true;
    this.detailLoading = true;
    this.detailError = '';
    this.detail = null;
    this.feedbackDraft = '';

    this.teacherService.getSubmission(id).subscribe({
      next: (res) => {
        this.detail = res.data;
        this.feedbackDraft = res.data?.feedback || '';
        this.detailLoading = false;
      },
      error: (err: any) => {
        this.detailLoading = false;
        this.detailError = typeof err === 'string' ? err : err?.message || 'No se pudo cargar la entrega';
      },
    });
  }

  closeDetail(updateUrl = true): void {
    this.detailOpen = false;
    this.detailLoading = false;
    this.detailError = '';
    this.detail = null;
    this.feedbackDraft = '';

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { open: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  openFromRow(item: TeacherSubmissionListItem): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { open: item.id },
      queryParamsHandling: 'merge',
    });
  }

  goToEvidence(detail: TeacherSubmissionDetail): void {
    if (!detail?.course_id || !detail?.evidence_id) return;
    this.closeDetail();
    this.router.navigate(['/projects', detail.course_id, 'evidence', detail.evidence_id]);
  }

  review(status: 'approved' | 'changes_requested', goNext: boolean): void {
    if (!this.detail?.id) return;

    this.detailLoading = true;
    this.detailError = '';

    this.teacherService
      .reviewSubmission(this.detail.id, {
        status,
        feedback: this.feedbackDraft || '',
      })
      .subscribe({
        next: async () => {
          this.detailLoading = false;
          this.loadSubmissions();

          if (goNext) {
            this.openNextPending();
            return;
          }

          this.closeDetail();
        },
        error: (err: any) => {
          this.detailLoading = false;
          this.detailError = typeof err === 'string' ? err : err?.message || 'No se pudo guardar la revisión';
        },
      });
  }

  openNextPending(): void {
    const currentId = this.detail?.id;
    if (!currentId) return;
    const normalizedQuery = this.q.trim();

    this.teacherService
      .getNextSubmission(currentId, {
        course_id: this.selectedCourseId || undefined,
        q: normalizedQuery || undefined,
      })
      .subscribe({
        next: (res) => {
          const nextId = res.data?.next_id || null;
          if (!nextId) {
            this.closeDetail();
            return;
          }
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { open: nextId },
            queryParamsHandling: 'merge',
          });
        },
        error: () => {
          this.closeDetail();
        },
      });
  }

  statusLabel(status: TeacherSubmissionListItem['status']): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'changes_requested':
        return 'Cambios';
      default:
        return status;
    }
  }

  private loadCourses(): void {
    this.coursesLoading = true;
    this.teacherService.getCourses({ page: 1, page_size: 100 }).subscribe({
      next: (res) => {
        this.courses = res.data?.items || [];
        this.coursesLoading = false;
      },
      error: () => {
        this.courses = [];
        this.coursesLoading = false;
      },
    });
  }

  private loadSubmissions(): void {
    this.loading = true;
    this.errorMessage = '';
    const normalizedQuery = this.q.trim();

    this.teacherService
      .getSubmissions({
        status: this.status,
        course_id: this.selectedCourseId || undefined,
        q: normalizedQuery || undefined,
        sort: this.sort,
        page: this.page,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.submissions = res.data?.items || [];
          this.total = res.meta?.total || this.submissions.length;
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.submissions = [];
          this.total = 0;
          this.errorMessage =
            typeof err === 'string' ? err : err?.message || 'No se pudieron cargar las entregas';
        },
      });
  }

  private setupSearchSuggestions(): void {
    this.searchSub = this.searchTerms$
      .pipe(
        map((term: string) => term.trim()),
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (term.length < 2) {
            this.suggestionsLoading = false;
            return of([] as TeacherSubmissionListItem[]);
          }

          this.suggestionsLoading = true;
          return this.teacherService
            .getSubmissions({
              status: 'all',
              include_unsubmitted: true,
              course_id: this.selectedCourseId || undefined,
              q: term,
              page: 1,
              page_size: 8,
              sort: 'created_at_desc',
            })
            .pipe(
              map((res) => res.data?.items || []),
              catchError(() => of([] as TeacherSubmissionListItem[])),
              finalize(() => {
                this.suggestionsLoading = false;
              }),
            );
        }),
      )
      .subscribe((items) => {
        this.suggestions = this.mapSuggestions(items);
        this.showSuggestions = this.hasSearchFocus && this.q.trim().length >= 2;
      });
  }

  private mapSuggestions(items: TeacherSubmissionListItem[]): DeliverySuggestion[] {
    const seen = new Set<string>();
    const suggestions: DeliverySuggestion[] = [];

    for (const item of items) {
      const hasMilestone = !!(item.milestone_title || '').trim();
      const query = (
        hasMilestone
          ? item.milestone_title || ''
          : item.title || item.student_name || item.course_name || ''
      ).trim();
      if (!query) continue;

      const source: DeliverySuggestion['source'] =
        hasMilestone && !item.evidence_id ? 'activity' : 'submission';
      const key = hasMilestone
        ? `milestone::${item.milestone_id || `${item.course_id}::${query.toLowerCase()}`}`
        : `${query.toLowerCase()}::${item.student_id}::${item.course_id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push({
        id: item.id,
        query,
        title: query,
        subtitle: hasMilestone
          ? `${item.course_name} · ${source === 'activity' ? 'Actividad publicada' : this.statusLabel(item.status)}`
          : `${item.course_name} · ${item.student_name} · ${this.statusLabel(item.status)}`,
        courseId: item.course_id,
        source,
        status: item.status,
      });
    }

    return suggestions;
  }
}
