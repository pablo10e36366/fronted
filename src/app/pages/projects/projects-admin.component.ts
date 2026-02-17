import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, catchError, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ProjectService } from '../../core/data-access/project.service';
import { ProjectDto } from '../../core/models/project.models';
import { FileUploadZoneComponent } from '../../components/file-upload-zone/file-upload-zone';

type ProjectStatusType = 'draft' | 'in_progress' | 'in_review' | 'completed';

interface ProjectUI extends ProjectDto {
  tags: string[];
  progress: number;
  uiStatus: ProjectStatusType;
}

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

  projects: ProjectUI[] = [];
  filteredProjects: ProjectUI[] = [];
  transitionsByProject: Record<string, string[]> = {};
  loadingTransitionsByProject: Record<string, boolean> = {};

  kpiTotal = 0;
  kpiReview = 0;
  kpiCompleted = 0;
  kpiScore = 0;

  searchTerm = '';
  searchSubject = new Subject<string>();
  filterStatus: 'ALL' | ProjectStatusType = 'ALL';
  filterTech = 'ALL';

  sortBy: 'title' | 'createdAt' | 'progress' | 'status' = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  title = '';
  description = '';
  selectedFile: File | null = null;

  loading = false;
  errorMessage = '';
  successMessage = '';

  showEditModal = false;
  editingProject: ProjectUI | null = null;
  editTitle = '';
  editDescription = '';

  showForceStatusModal = false;
  forceStatusProject: ProjectUI | null = null;
  forceStatusValue: ProjectStatusType = 'draft';
  forceStatusReason = '';

  private subscriptions = new Subscription();

  constructor(
    private projectsService: ProjectService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
        this.loading = false;
      });

    this.subscriptions.add(sub);
  }

  private enrichProject(project: ProjectDto): ProjectUI {
    const tagsPool = [
      ['Angular', 'Frontend'],
      ['NestJS', 'Backend'],
      ['Design', 'Figma'],
      ['Docs'],
      ['Math', 'Calculus'],
    ];
    const progressMap: Record<ProjectStatusType, number> = {
      draft: 10,
      in_progress: 45,
      in_review: 75,
      completed: 100,
    };

    const uiStatus = this.normalizeStatus(project.status);

    return {
      ...project,
      tags: tagsPool[Math.floor(Math.random() * tagsPool.length)],
      progress: progressMap[uiStatus],
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
      const matchesSearch =
        !normalizedSearchTerm ||
        project.title.toLowerCase().includes(normalizedSearchTerm) ||
        (project.description || '').toLowerCase().includes(normalizedSearchTerm) ||
        project.tags.some((tag) => tag.toLowerCase().includes(normalizedSearchTerm)) ||
        (project.owner?.name || '').toLowerCase().includes(normalizedSearchTerm);

      const matchesStatus =
        this.filterStatus === 'ALL' || this.normalizeStatus(project.status) === this.filterStatus;

      const matchesTech =
        this.filterTech === 'ALL' ||
        project.tags.some((tag) => tag.toUpperCase().includes(this.filterTech));

      return matchesSearch && matchesStatus && matchesTech;
    });

    this.applySorting();
  }

  updateKPIs(): void {
    this.kpiTotal = this.projects.length;
    this.kpiReview = this.projects.filter((project) => project.uiStatus === 'in_review').length;
    this.kpiCompleted = this.projects.filter((project) => project.uiStatus === 'completed').length;
    this.kpiScore = this.kpiTotal > 0 ? Math.round((this.kpiCompleted / this.kpiTotal) * 100) : 0;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
    if (!term.trim()) {
      this.applyFilters();
    }
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
        case 'progress':
          leftValue = leftProject.progress;
          rightValue = rightProject.progress;
          break;
        case 'status':
          leftValue = leftProject.uiStatus;
          rightValue = rightProject.uiStatus;
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
      this.errorMessage = 'El título del proyecto es obligatorio.';
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
    if (!this.filteredProjects.length) {
      this.errorMessage = 'No hay proyectos para exportar.';
      return;
    }

    const headers = ['id', 'titulo', 'descripcion', 'estado', 'progreso', 'propietario', 'fecha_creacion'];
    const rows = this.filteredProjects.map((project) => [
      project.id,
      project.title,
      project.description || '',
      this.getStatusLabel(project.uiStatus),
      `${project.progress}%`,
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
    link.download = `proyectos-admin-${new Date().toISOString().slice(0, 10)}.csv`;
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
      this.errorMessage = 'El título no puede estar vacío.';
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
    if (!confirm('¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
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

  loadTransitions(projectId: string): void {
    if (this.transitionsByProject[projectId]) return;
    this.loadingTransitionsByProject[projectId] = true;

    const sub = this.projectsService.getProjectTransitions(projectId).subscribe({
      next: (response) => {
        this.transitionsByProject[projectId] = response.availableStates || [];
        this.loadingTransitionsByProject[projectId] = false;
      },
      error: () => {
        this.transitionsByProject[projectId] = [];
        this.loadingTransitionsByProject[projectId] = false;
      },
    });

    this.subscriptions.add(sub);
  }

  getTransitions(projectId: string): string[] {
    return this.transitionsByProject[projectId] || [];
  }

  changeProjectStatus(project: ProjectUI, newStatus: string): void {
    if (!newStatus || newStatus === this.normalizeStatus(project.status)) return;
    this.loading = true;

    const sub = this.projectsService.changeProjectStatus(project.id, newStatus).subscribe({
      next: (updatedProject) => {
        this.updateProjectInList(updatedProject);
        this.successMessage = `Estado actualizado a ${this.getStatusLabel(newStatus)}.`;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      },
    });

    this.subscriptions.add(sub);
  }

  openForceStatusModal(project: ProjectUI): void {
    this.forceStatusProject = project;
    this.forceStatusValue = this.normalizeStatus(project.status);
    this.forceStatusReason = '';
    this.showForceStatusModal = true;
  }

  closeForceStatusModal(): void {
    this.showForceStatusModal = false;
    this.forceStatusProject = null;
    this.forceStatusValue = 'draft';
    this.forceStatusReason = '';
  }

  confirmForceStatus(): void {
    if (!this.forceStatusProject) return;
    if (!this.forceStatusReason.trim()) {
      this.errorMessage = 'Debes indicar la razón del cambio forzado.';
      return;
    }

    this.loading = true;
    const sub = this.projectsService
      .forceStatusChange(
        this.forceStatusProject.id,
        this.forceStatusValue,
        this.forceStatusReason.trim(),
      )
      .subscribe({
        next: (updatedProject) => {
          this.updateProjectInList(updatedProject);
          this.successMessage = 'Estado forzado correctamente.';
          this.closeForceStatusModal();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        },
      });

    this.subscriptions.add(sub);
  }

  archiveProject(project: ProjectUI): void {
    if (!confirm(`¿Archivar el proyecto "${project.title}"?`)) return;

    const reason = prompt('Razón del archivado (obligatoria):', 'Archivado por administración');
    if (!reason || !reason.trim()) return;

    this.loading = true;
    const sub = this.projectsService.archiveProject(project.id, reason.trim()).subscribe({
      next: () => {
        this.successMessage = 'Proyecto archivado correctamente.';
        this.loadProjects();
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      },
    });

    this.subscriptions.add(sub);
  }

  getStatusLabel(status: string): string {
    switch (this.normalizeStatus(status)) {
      case 'draft':
        return 'Borrador';
      case 'in_progress':
        return 'En progreso';
      case 'in_review':
        return 'En revisión';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  }

  private updateProjectInList(updatedProject: ProjectDto): void {
    const updatedUiProject = this.enrichProject(updatedProject);
    const index = this.projects.findIndex((project) => project.id === updatedProject.id);
    if (index >= 0) {
      this.projects[index] = updatedUiProject;
    } else {
      this.projects.unshift(updatedUiProject);
    }
    this.applyFilters();
    this.updateKPIs();
  }

  private handleError(error: unknown): void {
    this.errorMessage =
      typeof error === 'string'
        ? error
        : (error as { message?: string })?.message || 'No se pudo completar la operación.';
  }
}
