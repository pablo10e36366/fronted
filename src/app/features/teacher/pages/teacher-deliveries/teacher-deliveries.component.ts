import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { EvidenceService } from '../../../../core/data-access/evidence.service';
import { TeacherService } from '../../data-access/teacher.service';

type StatusFilter = 'pending' | 'approved' | 'changes_requested' | 'all';
type EvidenceViewerMode =
  | 'pdf'
  | 'image'
  | 'text'
  | 'video'
  | 'audio'
  | 'docx'
  | 'presentation'
  | 'spreadsheet'
  | 'iframe'
  | 'unsupported';

interface ViewerSlide {
  title: string;
  lines: string[];
}

type EvidenceViewerStorageKind = 'comment';

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

  evidenceViewerOpen = false;
  evidenceViewerLoading = false;
  evidenceViewerError = '';
  evidenceViewerMode: EvidenceViewerMode = 'unsupported';
  evidenceViewerTitle = '';
  evidenceViewerMimeType = '';
  evidenceViewerTextContent = '';
  evidenceViewerDocxHtml = '';
  evidenceViewerSlides: ViewerSlide[] = [];
  evidenceViewerSheetRows: string[][] = [];
  evidenceViewerSheetCols: number[] = [];
  evidenceViewerObjectUrl: string | null = null;
  evidenceViewerSafeUrl: SafeResourceUrl | null = null;
  evidenceViewerDetail: TeacherSubmissionDetail | null = null;
  evidenceViewerCommentDraft = '';
  evidenceViewerGradeDraft = '';
  evidenceViewerReviewLoading = false;
  evidenceViewerReviewMessage = '';

  private sub?: Subscription;
  private queryParamSub?: Subscription;
  private searchSub?: Subscription;
  private searchFilterSub?: Subscription;
  private searchTerms$ = new Subject<string>();
  private searchFilterTerms$ = new Subject<string>();

  constructor(
    private teacherService: TeacherService,
    private evidenceService: EvidenceService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.setupSearchSuggestions();
    this.setupRealtimeSearchFilter();

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
    this.searchFilterSub?.unsubscribe();
    this.revokeEvidenceViewerUrl();
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
    this.searchFilterTerms$.next(value);
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
    this.openEvidenceViewer(detail);
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

  private setupRealtimeSearchFilter(): void {
    this.searchFilterSub = this.searchFilterTerms$
      .pipe(
        map((term: string) => term.trim()),
        debounceTime(250),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.applyFilters();
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

  openEvidenceViewer(detail: TeacherSubmissionDetail): void {
    if (!detail?.evidence_id) return;

    this.evidenceViewerOpen = true;
    this.evidenceViewerLoading = true;
    this.evidenceViewerError = '';
    this.evidenceViewerMode = 'unsupported';
    this.evidenceViewerTitle = detail.evidence_title || 'Evidencia';
    this.evidenceViewerMimeType = '';
    this.evidenceViewerTextContent = '';
    this.evidenceViewerDocxHtml = '';
    this.evidenceViewerSlides = [];
    this.evidenceViewerSheetRows = [];
    this.evidenceViewerSheetCols = [];
    this.evidenceViewerDetail = detail;
    this.evidenceViewerReviewLoading = false;
    this.evidenceViewerReviewMessage = '';
    this.evidenceViewerGradeDraft = '';
    this.loadEvidenceViewerComment(detail.evidence_id);
    this.revokeEvidenceViewerUrl();

    this.evidenceService.downloadEvidenceFile(detail.evidence_id).subscribe({
      next: (blob) => {
        void this.prepareEvidenceViewer(blob, detail.evidence_title || '');
      },
      error: (err: unknown) => {
        this.evidenceViewerLoading = false;
        this.evidenceViewerError = 'No se pudo abrir la evidencia.';
        this.detailError =
          typeof err === 'string' ? err : (err as { message?: string })?.message || '';
      },
    });
  }

  closeEvidenceViewer(): void {
    this.saveEvidenceViewerComment();
    this.evidenceViewerOpen = false;
    this.evidenceViewerLoading = false;
    this.evidenceViewerError = '';
    this.evidenceViewerMode = 'unsupported';
    this.evidenceViewerTitle = '';
    this.evidenceViewerMimeType = '';
    this.evidenceViewerTextContent = '';
    this.evidenceViewerDocxHtml = '';
    this.evidenceViewerSlides = [];
    this.evidenceViewerSheetRows = [];
    this.evidenceViewerSheetCols = [];
    this.evidenceViewerDetail = null;
    this.evidenceViewerCommentDraft = '';
    this.evidenceViewerGradeDraft = '';
    this.evidenceViewerReviewLoading = false;
    this.evidenceViewerReviewMessage = '';
    this.revokeEvidenceViewerUrl();
  }

  saveEvidenceViewerComment(): void {
    const evidenceId = this.evidenceViewerDetail?.evidence_id;
    if (!evidenceId) return;

    const key = this.getEvidenceViewerStorageKey('comment', evidenceId);
    const value = this.evidenceViewerCommentDraft.trim();
    if (!value) {
      this.safeStorageRemove(key);
      return;
    }
    this.safeStorageSet(key, value);
  }

  clearEvidenceViewerComment(): void {
    const evidenceId = this.evidenceViewerDetail?.evidence_id;
    if (!evidenceId) return;
    const key = this.getEvidenceViewerStorageKey('comment', evidenceId);
    this.evidenceViewerCommentDraft = '';
    this.safeStorageRemove(key);
  }

  reviewEvidenceWithComment(status: 'approved' | 'changes_requested'): void {
    const detail = this.evidenceViewerDetail;
    if (!detail?.id) return;

    const feedback = this.evidenceViewerCommentDraft.trim();
    if (!feedback) {
      this.evidenceViewerError = 'Escribe un comentario antes de enviar la revision.';
      return;
    }

    const parsedGrade = this.parseEvidenceViewerGrade(this.evidenceViewerGradeDraft);
    if (status === 'approved' && parsedGrade === null) {
      this.evidenceViewerError = 'Ingresa una calificacion valida (0 a 10) para calificar.';
      return;
    }

    const feedbackWithGrade =
      parsedGrade === null ? feedback : `Calificacion: ${parsedGrade}\n${feedback}`;

    this.saveEvidenceViewerComment();
    this.evidenceViewerError = '';
    this.evidenceViewerReviewMessage = '';
    this.evidenceViewerReviewLoading = true;

    this.teacherService
      .reviewSubmission(detail.id, {
        status,
        feedback: feedbackWithGrade,
        rubric_scores: parsedGrade === null ? null : { score: parsedGrade },
      })
      .subscribe({
        next: (res) => {
          this.evidenceViewerReviewLoading = false;
          this.evidenceViewerReviewMessage =
            status === 'approved'
              ? 'Entrega calificada con comentario.'
              : 'Cambios solicitados con comentario.';

          if (this.detail?.id === detail.id) {
            this.detail = res.data;
            this.feedbackDraft = res.data?.feedback || feedbackWithGrade;
          }
          this.loadSubmissions();
        },
        error: (err: unknown) => {
          this.evidenceViewerReviewLoading = false;
          this.evidenceViewerError =
            typeof err === 'string'
              ? err
              : (err as { message?: string })?.message || 'No se pudo guardar la revision.';
        },
      });
  }

  private parseEvidenceViewerGrade(rawValue: string): number | null {
    const normalized = String(rawValue || '').trim().replace(',', '.');
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    if (value < 0 || value > 10) return null;
    return Math.round(value * 100) / 100;
  }

  downloadEvidenceFromViewer(): void {
    const evidenceId = this.evidenceViewerDetail?.evidence_id;
    if (!evidenceId) return;

    this.evidenceService.downloadEvidenceFile(evidenceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = (this.evidenceViewerDetail?.evidence_title || 'evidencia').trim();
        link.download = fileName || 'evidencia';
        link.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  private async prepareEvidenceViewer(blob: Blob, fileName: string): Promise<void> {
    try {
      const effectiveMimeType = (blob.type || '').toLowerCase();
      this.evidenceViewerMimeType = effectiveMimeType || 'application/octet-stream';
      this.evidenceViewerMode = this.resolveEvidenceViewerMode(effectiveMimeType, fileName);

      if (this.evidenceViewerMode === 'text') {
        this.evidenceViewerTextContent = await blob.text();
        this.evidenceViewerLoading = false;
        return;
      }

      if (this.evidenceViewerMode === 'docx') {
        await this.loadDocx(blob);
        this.evidenceViewerLoading = false;
        return;
      }

      if (this.evidenceViewerMode === 'presentation') {
        await this.loadPresentation(blob);
        this.evidenceViewerLoading = false;
        return;
      }

      if (this.evidenceViewerMode === 'spreadsheet') {
        await this.loadSpreadsheet(blob);
        this.evidenceViewerLoading = false;
        return;
      }

      this.evidenceViewerObjectUrl = URL.createObjectURL(blob);
      if (this.evidenceViewerMode === 'pdf' || this.evidenceViewerMode === 'iframe') {
        this.evidenceViewerSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.evidenceViewerObjectUrl,
        );
      }
      this.evidenceViewerLoading = false;
    } catch {
      this.evidenceViewerLoading = false;
      this.evidenceViewerError = 'No se pudo renderizar esta evidencia.';
      this.evidenceViewerMode = 'unsupported';
    }
  }

  private resolveEvidenceViewerMode(mimeType: string, fileName?: string): EvidenceViewerMode {
    const mime = (mimeType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();

    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';

    const docxLike =
      mime.includes('wordprocessingml') ||
      mime.includes('msword') ||
      lowerName.endsWith('.docx');
    if (docxLike) return 'docx';

    const presentationLike =
      mime.includes('presentationml') ||
      mime.includes('powerpoint') ||
      lowerName.endsWith('.pptx');
    if (presentationLike) return 'presentation';

    const spreadsheetLike =
      mime.includes('spreadsheetml') ||
      mime.includes('ms-excel') ||
      mime.includes('excel') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv');
    if (spreadsheetLike) return 'spreadsheet';

    const iframeFriendly =
      mime.includes('officedocument') ||
      mime.includes('rtf') ||
      mime.includes('html');
    if (iframeFriendly) return 'iframe';

    const textLike =
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      mime.endsWith('+json') ||
      mime === 'application/xml' ||
      mime.endsWith('+xml') ||
      mime.includes('csv') ||
      mime.includes('javascript');
    if (textLike) return 'text';

    return 'unsupported';
  }

  private async loadSpreadsheet(blob: Blob): Promise<void> {
    const xlsx = await import('xlsx');
    const buffer = await blob.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

    if (!sheet) {
      this.evidenceViewerSheetRows = [];
      this.evidenceViewerSheetCols = [];
      this.evidenceViewerError = 'No se pudo leer la hoja del archivo.';
      return;
    }

    const rows = xlsx.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });

    const normalizedRows = rows
      .slice(0, 300)
      .map((row) => row.map((cell) => String(cell ?? '')));
    const maxCols = normalizedRows.reduce((max, row) => Math.max(max, row.length), 0);

    this.evidenceViewerSheetRows = normalizedRows.map((row) => {
      if (row.length >= maxCols) return row;
      return [...row, ...new Array(maxCols - row.length).fill('')];
    });
    this.evidenceViewerSheetCols = Array.from({ length: maxCols }, (_, idx) => idx);
  }

  private async loadDocx(blob: Blob): Promise<void> {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule as unknown as {
      convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    const buffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = (result?.value || '').trim();
    this.evidenceViewerDocxHtml = html || '<p>Documento sin contenido visible.</p>';
  }

  private async loadPresentation(blob: Blob): Promise<void> {
    const jszipModule = await import('jszip');
    const JSZipCtor = (jszipModule as { default?: unknown } & Record<string, unknown>).default
      ? (jszipModule as {
          default: {
            loadAsync: (data: ArrayBuffer) => Promise<{ files: Record<string, { async: (type: 'text') => Promise<string> }> }>;
          };
        }).default
      : (jszipModule as {
          loadAsync: (data: ArrayBuffer) => Promise<{ files: Record<string, { async: (type: 'text') => Promise<string> }> }>;
        });

    const buffer = await blob.arrayBuffer();
    const zip = await JSZipCtor.loadAsync(buffer);
    const slidePaths = Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
      .sort((a, b) => this.extractSlideIndex(a) - this.extractSlideIndex(b));

    const slides: ViewerSlide[] = [];
    for (const [idx, path] of slidePaths.entries()) {
      const file = zip.files[path];
      if (!file) continue;
      const xml = await file.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');

      const taggedTexts = Array.from(doc.getElementsByTagName('a:t')).map((node) =>
        (node.textContent || '').trim(),
      );
      const fallbackTexts = taggedTexts.length
        ? taggedTexts
        : Array.from(doc.getElementsByTagName('t')).map((node) => (node.textContent || '').trim());

      const lines = fallbackTexts.filter((line) => !!line);
      slides.push({
        title: `Diapositiva ${idx + 1}`,
        lines: lines.length ? lines : ['(Sin texto extraible en esta diapositiva)'],
      });
    }

    this.evidenceViewerSlides = slides.slice(0, 100);
    if (!this.evidenceViewerSlides.length) {
      this.evidenceViewerError = 'No se pudo extraer contenido visible del PPTX.';
    }
  }

  private extractSlideIndex(path: string): number {
    const match = path.match(/slide(\d+)\.xml$/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  private revokeEvidenceViewerUrl(): void {
    if (this.evidenceViewerObjectUrl) {
      URL.revokeObjectURL(this.evidenceViewerObjectUrl);
    }
    this.evidenceViewerObjectUrl = null;
    this.evidenceViewerSafeUrl = null;
  }

  private loadEvidenceViewerComment(evidenceId: string): void {
    const key = this.getEvidenceViewerStorageKey('comment', evidenceId);
    this.evidenceViewerCommentDraft = this.safeStorageGet(key);
  }

  private getEvidenceViewerStorageKey(kind: EvidenceViewerStorageKind, evidenceId: string): string {
    return `promanage:teacher:evidence:${kind}:${evidenceId}`;
  }

  private safeStorageGet(key: string): string {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  private safeStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage write errors
    }
  }

  private safeStorageRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage write errors
    }
  }
}
