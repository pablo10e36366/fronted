import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ProjectService } from '../../core/data-access/project.service';
import { EvidenceService } from '../../core/data-access/evidence.service';
import { EvidenceDto, ProjectDto } from '../../core/models/project.models';
import { FileUploadZoneComponent } from '../../components/file-upload-zone/file-upload-zone';

type ProjectStatusType = 'draft' | 'in_progress' | 'in_review' | 'completed';

interface ProjectUI extends ProjectDto {
  uiStatus: ProjectStatusType;
}

interface DocumentRow {
  evidenceId: string;
  projectId: string;
  title: string;
  projectTitle: string;
  ownerName: string;
  ownerEmail: string;
  mimeType: string;
  updatedAt?: string;
}

type DocumentViewerMode =
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

type DocumentViewerStorageKind = 'comment';

@Component({
  standalone: true,
  selector: 'app-projects-admin',
  templateUrl: './projects-admin.component.html',
  styleUrls: ['./projects-admin.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, FileUploadZoneComponent],
})
export class ProjectsAdminComponent implements OnInit, OnDestroy {
  @ViewChild(FileUploadZoneComponent) fileUploadZone!: FileUploadZoneComponent;
  @ViewChild('newProjectTitle') newProjectTitle?: ElementRef<HTMLInputElement>;

  activeView: 'courses' | 'documents' = 'courses';

  projects: ProjectUI[] = [];
  filteredProjects: ProjectUI[] = [];

  documents: DocumentRow[] = [];
  filteredDocuments: DocumentRow[] = [];

  kpiTotal = 0;
  kpiReview = 0;
  kpiCompleted = 0;
  kpiScore = 0;

  searchTerm = '';
  searchSubject = new Subject<string>();

  sortBy: 'title' | 'createdAt' = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  title = '';
  description = '';
  selectedFile: File | null = null;

  loading = false;
  loadingDocuments = false;
  errorMessage = '';
  successMessage = '';

  showEditModal = false;
  editingProject: ProjectUI | null = null;
  editTitle = '';
  editDescription = '';

  showDocumentViewer = false;
  viewerLoading = false;
  viewerError = '';
  viewerMode: DocumentViewerMode = 'unsupported';
  viewerTitle = '';
  viewerMimeType = '';
  viewerTextContent = '';
  viewerDocxHtml = '';
  viewerSlides: ViewerSlide[] = [];
  viewerSheetRows: string[][] = [];
  viewerSheetCols: number[] = [];
  viewerObjectUrl: string | null = null;
  viewerSafeUrl: SafeResourceUrl | null = null;
  viewingDocument: DocumentRow | null = null;
  viewerCommentDraft = '';
  viewerCommentSaved = false;

  private subscriptions = new Subscription();

  constructor(
    private projectsService: ProjectService,
    private evidenceService: EvidenceService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.revokeViewerUrl();
  }

  private setupSearch(): void {
    const sub = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          this.loading = true;
          this.errorMessage = '';
          const trimmedTerm = term.trim();
          const request$ = trimmedTerm
            ? this.projectsService.searchProjects(trimmedTerm)
            : this.projectsService.getAllProjects();

          return request$.pipe(
            catchError((err) => {
              this.handleError(err);
              return of([] as ProjectDto[]);
            }),
          );
        }),
      )
      .subscribe((projects: ProjectDto[]) => {
        this.projects = projects.map((project) => this.enrichProject(project));
        this.applyFilters();
        this.updateKPIs();
        this.loadDocuments(this.projects);
        this.loading = false;
      });

    this.subscriptions.add(sub);
  }

  private enrichProject(project: ProjectDto): ProjectUI {
    const uiStatus = this.normalizeStatus(project.status);

    return {
      ...project,
      uiStatus,
    };
  }

  private normalizeStatus(status: string | null | undefined): ProjectStatusType {
    const normalized = String(status || 'draft').toLowerCase();
    if (
      normalized === 'draft' ||
      normalized === 'in_progress' ||
      normalized === 'in_review' ||
      normalized === 'completed'
    ) {
      return normalized;
    }
    return 'draft';
  }

  loadProjects(): void {
    this.loading = true;
    this.errorMessage = '';

    const sub = this.projectsService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects.map((project) => this.enrichProject(project));
        this.applyFilters();
        this.updateKPIs();
        this.loadDocuments(this.projects);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      },
    });

    this.subscriptions.add(sub);
  }

  applyFilters(): void {
    const normalizedSearchTerm = this.searchTerm.toLowerCase().trim();
    this.filteredProjects = this.projects.filter((project) => {
      return (
        !normalizedSearchTerm ||
        project.title.toLowerCase().includes(normalizedSearchTerm) ||
        (project.description || '').toLowerCase().includes(normalizedSearchTerm) ||
        (project.owner?.name || '').toLowerCase().includes(normalizedSearchTerm)
      );
    });

    this.applySorting();
  }

  private applyDocumentFilters(): void {
    const normalizedSearchTerm = this.searchTerm.toLowerCase().trim();
    this.filteredDocuments = this.documents.filter((document) => {
      return (
        !normalizedSearchTerm ||
        document.title.toLowerCase().includes(normalizedSearchTerm) ||
        document.projectTitle.toLowerCase().includes(normalizedSearchTerm) ||
        document.ownerName.toLowerCase().includes(normalizedSearchTerm) ||
        document.mimeType.toLowerCase().includes(normalizedSearchTerm)
      );
    });
  }

  updateKPIs(): void {
    this.kpiTotal = this.projects.length;
    this.kpiReview = this.projects.filter((project) => project.uiStatus === 'in_review').length;
    this.kpiCompleted = this.projects.filter((project) => project.uiStatus === 'completed').length;
    this.kpiScore = this.kpiTotal > 0 ? Math.round((this.kpiCompleted / this.kpiTotal) * 100) : 0;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    if (this.activeView === 'documents') {
      this.applyDocumentFilters();
      return;
    }

    this.searchSubject.next(term);
    if (!term.trim()) {
      this.applyFilters();
    }
  }

  setActiveView(view: 'courses' | 'documents'): void {
    if (this.activeView === view) return;
    this.activeView = view;
    this.searchTerm = '';

    if (view === 'courses') {
      this.applyFilters();
      return;
    }

    this.applyDocumentFilters();
  }

  applySorting(): void {
    this.filteredProjects.sort((leftProject, rightProject) => {
      let leftValue: string | number = '';
      let rightValue: string | number = '';

      switch (this.sortBy) {
        case 'title':
          leftValue = leftProject.title.toLowerCase();
          rightValue = rightProject.title.toLowerCase();
          break;
        case 'createdAt':
          leftValue = leftProject.createdAt ? new Date(leftProject.createdAt).getTime() : 0;
          rightValue = rightProject.createdAt ? new Date(rightProject.createdAt).getTime() : 0;
          break;
      }

      if (leftValue < rightValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  focusNewProject(): void {
    const titleInput = this.newProjectTitle?.nativeElement;
    if (!titleInput) return;
    titleInput.focus();
    titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onProjectFileSelected(file: File | undefined): void {
    this.selectedFile = file || null;
    if (this.selectedFile && !this.title.trim()) {
      this.title = this.selectedFile.name.replace(/\.[^/.]+$/, '');
    }
  }

  createProject(): void {
    if (!this.title.trim()) {
      this.errorMessage = 'El titulo del proyecto es obligatorio.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const sub = this.projectsService
      .uploadProject(this.title.trim(), this.description.trim(), this.selectedFile)
      .subscribe({
        next: () => {
          this.successMessage = 'Proyecto creado correctamente.';
          this.title = '';
          this.description = '';
          this.selectedFile = null;
          this.fileUploadZone?.reset?.();
          this.loadProjects();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        },
      });

    this.subscriptions.add(sub);
  }

  exportProjects(): void {
    if (this.activeView === 'documents') {
      this.exportDocuments();
      return;
    }

    if (!this.filteredProjects.length) {
      this.errorMessage = 'No hay cursos para exportar.';
      return;
    }

    const headers = ['id', 'curso', 'descripcion', 'propietario', 'fecha_creacion'];
    const rows = this.filteredProjects.map((project) => [
      project.id,
      project.title,
      project.description || '',
      project.owner?.name || '',
      project.createdAt || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cursos-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  viewProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  downloadProject(project: ProjectUI): void {
    const sub = this.projectsService.downloadProjectFile(project.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = project.filename || `${project.title}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => this.handleError(err),
    });
    this.subscriptions.add(sub);
  }

  viewDocument(doc: DocumentRow): void {
    this.showDocumentViewer = true;
    this.viewerLoading = true;
    this.viewerError = '';
    this.viewerMode = 'unsupported';
    this.viewerTextContent = '';
    this.viewerDocxHtml = '';
    this.viewerSlides = [];
    this.viewerSheetRows = [];
    this.viewerSheetCols = [];
    this.viewerTitle = doc.title || 'Documento';
    this.viewerMimeType = doc.mimeType || '';
    this.viewingDocument = doc;
    this.viewerCommentSaved = false;
    this.loadViewerComment(doc.evidenceId);
    this.revokeViewerUrl();

    const sub = this.evidenceService.downloadEvidenceFile(doc.evidenceId).subscribe({
      next: (blob) => {
        void this.prepareDocumentViewer(doc, blob);
      },
      error: (err) => {
        this.viewerLoading = false;
        this.viewerError = 'No se pudo abrir el documento.';
        this.handleError(err);
      },
    });

    this.subscriptions.add(sub);
  }

  downloadDocument(doc: DocumentRow): void {
    const sub = this.evidenceService.downloadEvidenceFile(doc.evidenceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = (doc.title || 'documento').trim();
        link.download = baseName.includes('.') ? baseName : `${baseName}.bin`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => this.handleError(err),
    });
    this.subscriptions.add(sub);
  }

  editProject(project: ProjectUI): void {
    this.editingProject = project;
    this.editTitle = project.title;
    this.editDescription = project.description || '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProject = null;
    this.editTitle = '';
    this.editDescription = '';
  }

  saveEdit(): void {
    if (!this.editingProject) return;
    if (!this.editTitle.trim()) {
      this.errorMessage = 'El titulo no puede estar vacio.';
      return;
    }

    this.loading = true;
    const sub = this.projectsService
      .updateProject(
        this.editingProject.id,
        this.editTitle.trim(),
        this.editDescription.trim(),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Proyecto actualizado correctamente.';
          this.closeEditModal();
          this.loadProjects();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        },
      });

    this.subscriptions.add(sub);
  }

  deleteProject(projectId: string): void {
    if (!confirm('Seguro que deseas eliminar este proyecto? Esta accion no se puede deshacer.')) {
      return;
    }

    const sub = this.projectsService.deleteProject(projectId).subscribe({
      next: () => {
        this.successMessage = 'Proyecto eliminado correctamente.';
        this.loadProjects();
      },
      error: (err) => this.handleError(err),
    });

    this.subscriptions.add(sub);
  }

  private loadDocuments(projects: ProjectUI[]): void {
    if (!projects.length) {
      this.documents = [];
      this.filteredDocuments = [];
      return;
    }

    this.loadingDocuments = true;
    const requests = projects.map((project) =>
      this.evidenceService.getFiles(project.id).pipe(
        map((files) => ({
          project,
          files: (files || []).filter((file) => !file.isFolder),
        })),
        catchError(() => of({ project, files: [] as EvidenceDto[] })),
      ),
    );

    const sub = forkJoin(requests).subscribe({
      next: (results) => {
        this.documents = results.flatMap(({ project, files }) =>
          files.map((file) => ({
            evidenceId: file.id,
            projectId: project.id,
            title: file.title || 'Documento',
            projectTitle: project.title || 'Curso',
            ownerName: project.owner?.name || 'Sin propietario',
            ownerEmail: project.owner?.email || 'N/A',
            mimeType: file.mimeType || 'Archivo',
            updatedAt: file.updatedAt,
          })),
        );
        this.applyDocumentFilters();
        this.loadingDocuments = false;
      },
      error: (err) => {
        this.loadingDocuments = false;
        this.documents = [];
        this.filteredDocuments = [];
        this.handleError(err);
      },
    });

    this.subscriptions.add(sub);
  }

  private exportDocuments(): void {
    if (!this.filteredDocuments.length) {
      this.errorMessage = 'No hay documentos para exportar.';
      return;
    }

    const headers = ['id', 'documento', 'curso', 'propietario', 'tipo', 'actualizado'];
    const rows = this.filteredDocuments.map((document) => [
      document.evidenceId,
      document.title,
      document.projectTitle,
      document.ownerName,
      document.mimeType,
      document.updatedAt || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documentos-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private handleError(error: unknown): void {
    this.errorMessage =
      typeof error === 'string'
        ? error
        : (error as { message?: string })?.message || 'No se pudo completar la operacion.';
  }

  closeDocumentViewer(): void {
    this.saveViewerComment();
    this.showDocumentViewer = false;
    this.viewerLoading = false;
    this.viewerError = '';
    this.viewerMode = 'unsupported';
    this.viewerTextContent = '';
    this.viewerDocxHtml = '';
    this.viewerSlides = [];
    this.viewerSheetRows = [];
    this.viewerSheetCols = [];
    this.viewerTitle = '';
    this.viewerMimeType = '';
    this.viewingDocument = null;
    this.viewerCommentDraft = '';
    this.viewerCommentSaved = false;
    this.revokeViewerUrl();
  }

  saveViewerComment(): void {
    const evidenceId = this.viewingDocument?.evidenceId;
    if (!evidenceId) return;

    const key = this.getDocumentViewerStorageKey('comment', evidenceId);
    const value = this.viewerCommentDraft.trim();
    if (!value) {
      this.safeStorageRemove(key);
      this.viewerCommentSaved = false;
      return;
    }
    this.safeStorageSet(key, value);
    this.viewerCommentSaved = true;
  }

  clearViewerComment(): void {
    const evidenceId = this.viewingDocument?.evidenceId;
    if (!evidenceId) return;
    const key = this.getDocumentViewerStorageKey('comment', evidenceId);
    this.viewerCommentDraft = '';
    this.safeStorageRemove(key);
    this.viewerCommentSaved = false;
  }

  private async prepareDocumentViewer(doc: DocumentRow, blob: Blob): Promise<void> {
    try {
      const effectiveMimeType = (blob.type || doc.mimeType || 'application/octet-stream').toLowerCase();
      this.viewerMimeType = effectiveMimeType;
      this.viewerMode = this.resolveViewerMode(effectiveMimeType, doc.title);

      if (this.viewerMode === 'text') {
        this.viewerTextContent = await blob.text();
        this.viewerLoading = false;
        return;
      }

      if (this.viewerMode === 'docx') {
        await this.loadDocx(blob);
        this.viewerLoading = false;
        return;
      }

      if (this.viewerMode === 'presentation') {
        await this.loadPresentation(blob);
        this.viewerLoading = false;
        return;
      }

      if (this.viewerMode === 'spreadsheet') {
        await this.loadSpreadsheet(blob);
        this.viewerLoading = false;
        return;
      }

      this.viewerObjectUrl = URL.createObjectURL(blob);
      if (this.viewerMode === 'pdf' || this.viewerMode === 'iframe') {
        this.viewerSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerObjectUrl);
      }
      this.viewerLoading = false;
    } catch {
      this.viewerLoading = false;
      this.viewerMode = 'unsupported';
      this.viewerError = 'No se pudo renderizar este archivo.';
    }
  }

  private resolveViewerMode(mimeType: string, fileName?: string): DocumentViewerMode {
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
      mime.includes('msword') ||
      mime.includes('msexcel') ||
      mime.includes('powerpoint') ||
      mime.includes('spreadsheetml') ||
      mime.includes('presentationml') ||
      mime.includes('wordprocessingml') ||
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

  private async loadDocx(blob: Blob): Promise<void> {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule as unknown as {
      convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    const buffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = (result?.value || '').trim();
    this.viewerDocxHtml = html || '<p>Documento sin contenido visible.</p>';
  }

  private async loadPresentation(blob: Blob): Promise<void> {
    const jszipModule = await import('jszip');
    const JSZipCtor = (jszipModule as { default?: unknown } & Record<string, unknown>).default
      ? (jszipModule as { default: { loadAsync: (data: ArrayBuffer) => Promise<{ files: Record<string, { async: (type: 'text') => Promise<string> }> }> } }).default
      : (jszipModule as { loadAsync: (data: ArrayBuffer) => Promise<{ files: Record<string, { async: (type: 'text') => Promise<string> }> }> });

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

    this.viewerSlides = slides.slice(0, 100);
    if (!this.viewerSlides.length) {
      this.viewerError = 'No se pudo extraer contenido visible del PPTX.';
    }
  }

  private extractSlideIndex(path: string): number {
    const match = path.match(/slide(\d+)\.xml$/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  private async loadSpreadsheet(blob: Blob): Promise<void> {
    const xlsx = await import('xlsx');
    const buffer = await blob.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

    if (!sheet) {
      this.viewerSheetRows = [];
      this.viewerSheetCols = [];
      this.viewerError = 'No se pudo leer la hoja del archivo.';
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

    this.viewerSheetRows = normalizedRows.map((row) => {
      if (row.length >= maxCols) return row;
      return [...row, ...new Array(maxCols - row.length).fill('')];
    });
    this.viewerSheetCols = Array.from({ length: maxCols }, (_, idx) => idx);
  }

  private revokeViewerUrl(): void {
    if (this.viewerObjectUrl) {
      URL.revokeObjectURL(this.viewerObjectUrl);
    }
    this.viewerObjectUrl = null;
    this.viewerSafeUrl = null;
  }

  private loadViewerComment(evidenceId: string): void {
    const key = this.getDocumentViewerStorageKey('comment', evidenceId);
    this.viewerCommentDraft = this.safeStorageGet(key);
  }

  private getDocumentViewerStorageKey(kind: DocumentViewerStorageKind, evidenceId: string): string {
    return `promanage:admin:document:${kind}:${evidenceId}`;
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
