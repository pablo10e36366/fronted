import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProjectService } from '../../../../core/data-access/project.service';
import { ProjectDto } from '../../../../core/models/project.models';

type StatusFilter = 'ALL' | 'draft' | 'in_progress' | 'in_review' | 'completed' | 'archived';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-projects">
      <div class="toolbar">
        <h2>Gestion de Cursos (Control)</h2>
        <div class="filters">
          <select [(ngModel)]="selectedStatus" (change)="applyStatusFilter()">
            <option value="ALL">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="in_progress">En progreso</option>
            <option value="in_review">En revision</option>
            <option value="completed">Completado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Curso</th>
              <th>Owner</th>
              <th>Estado actual</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProjects; trackBy: trackByProjectId">
              <td>
                <strong>{{ p.title }}</strong>
                <br />
                <small class="text-muted">ID: {{ p.id }}</small>
              </td>
              <td>
                <div class="owner-cell">
                  <span class="owner-name">{{ getOwnerName(p) }}</span>
                  <small class="owner-email" *ngIf="getOwnerEmail(p)">{{ getOwnerEmail(p) }}</small>
                </div>
              </td>
              <td>
                <span class="badge" [class]="getStatusClass(p.status)">{{ getStatusLabel(p.status) }}</span>
              </td>
              <td>
                <div class="controls">
                  <button
                    class="btn-sm btn-outline"
                    [disabled]="actionLoadingId === p.id"
                    (click)="forceStatus(p)">
                    {{ actionLoadingId === p.id ? 'Procesando...' : 'Forzar estado' }}
                  </button>
                  <button
                    class="btn-sm btn-outline danger"
                    [disabled]="actionLoadingId === p.id"
                    (click)="archiveProject(p)">
                    {{ actionLoadingId === p.id ? 'Procesando...' : 'Archivar' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filteredProjects.length && !loading">
              <td colspan="4" class="empty-state">No hay cursos para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-projects { padding: 1rem; }
    .toolbar { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    h2 { margin: 0; color: var(--slate-800); }

    .table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      max-width: 100%;
    }
    table { width: 100%; min-width: 860px; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--slate-100); white-space: nowrap; }
    th { background: var(--slate-50); color: var(--slate-500); font-weight: 600; }

    .text-muted { color: var(--slate-400); font-family: monospace; }
    .owner-cell { display: flex; flex-direction: column; gap: 0.1rem; }
    .owner-name { font-weight: 600; color: var(--slate-700); }
    .owner-email { color: var(--slate-500); font-size: 0.75rem; }

    .badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #475569; }
    .badge.in_progress { background: #dbeafe; color: #1e40af; }
    .badge.in_review { background: #fef3c7; color: #92400e; }
    .badge.completed { background: #dcfce7; color: #166534; }
    .badge.archived { background: #e5e7eb; color: #374151; }

    .controls { display: flex; gap: 0.5rem; }
    .btn-sm { font-size: 0.75rem; padding: 0.3rem 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; }
    .btn-sm:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-sm.danger { color: #991b1b; border-color: #fca5a5; }
    .btn-sm.danger:hover:not(:disabled) { background: #fef2f2; }
    .empty-state { text-align: center; color: #64748b; }
  `],
})
export class AdminProjectsComponent implements OnInit {
  projects: ProjectDto[] = [];
  filteredProjects: ProjectDto[] = [];
  selectedStatus: StatusFilter = 'ALL';
  loading = false;
  actionLoadingId: string | null = null;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAllProjects().subscribe({
      next: (projects: ProjectDto[]) => {
        this.projects = Array.isArray(projects) ? projects : [];
        this.applyStatusFilter();
        this.loading = false;
        this.actionLoadingId = null;
      },
      error: (err: unknown) => {
        console.error('Error loading courses:', err);
        this.loading = false;
        this.actionLoadingId = null;
      },
    });
  }

  applyStatusFilter(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredProjects = [...this.projects];
      return;
    }

    this.filteredProjects = this.projects.filter(
      (project) => this.normalizeStatus(project.status) === this.selectedStatus,
    );
  }

  forceStatus(project: ProjectDto): void {
    if (!project?.id) return;
    this.actionLoadingId = project.id;

    this.projectService.getProjectTransitions(project.id).subscribe({
      next: (data) => {
        const available = Array.isArray(data?.availableStates) ? data.availableStates : [];
        this.promptAndForceStatus(project, available);
      },
      error: () => {
        this.promptAndForceStatus(project, ['draft', 'in_progress', 'in_review', 'completed']);
      },
    });
  }

  private promptAndForceStatus(project: ProjectDto, optionsRaw: string[]): void {
    const options = Array.from(
      new Set(
        (optionsRaw || [])
          .map((option) => this.normalizeStatus(option))
          .filter(Boolean),
      ),
    );

    const fallbackOptions: StatusFilter[] = ['draft', 'in_progress', 'in_review', 'completed'];
    const validOptions = options.length ? options : fallbackOptions;
    const suggested = validOptions[0];

    const input = window.prompt(
      `Estados disponibles: ${validOptions.join(', ')}\nEscribe el nuevo estado:`,
      suggested,
    );
    if (!input) {
      this.actionLoadingId = null;
      return;
    }

    const normalizedInput = this.normalizeStatus(input);
    if (!validOptions.includes(normalizedInput)) {
      window.alert('Estado invalido. Usa uno de los estados disponibles.');
      this.actionLoadingId = null;
      return;
    }

    const reason = window.prompt('Razon del cambio forzado:', 'Cambio administrativo');
    if (!reason || !reason.trim()) {
      this.actionLoadingId = null;
      return;
    }

    this.projectService.forceStatusChange(project.id, normalizedInput, reason.trim()).subscribe({
      next: () => {
        window.alert(`Estado cambiado a: ${this.getStatusLabel(normalizedInput)}`);
        this.loadProjects();
      },
      error: (err: unknown) => {
        console.error('Error forcing status:', err);
        window.alert('Error al forzar estado del curso.');
        this.actionLoadingId = null;
      },
    });
  }

  archiveProject(project: ProjectDto): void {
    if (!project?.id) return;
    const reason = window.prompt(
      `¿Archivar curso "${project.title}"? Ingresa la razon:`,
      'Curso finalizado',
    );
    if (!reason || !reason.trim()) return;

    this.actionLoadingId = project.id;
    this.projectService.archiveProject(project.id, reason.trim()).subscribe({
      next: () => {
        window.alert('Curso archivado exitosamente');
        this.loadProjects();
      },
      error: (err: unknown) => {
        console.error('Error archiving course:', err);
        window.alert('Error al archivar curso');
        this.actionLoadingId = null;
      },
    });
  }

  getOwnerName(project: ProjectDto): string {
    const owner = project?.owner as unknown as { name?: string; email?: string } | string | null;
    if (!owner) return 'Sin owner';
    if (typeof owner === 'string') return owner;
    if (typeof owner.name === 'string' && owner.name.trim()) return owner.name.trim();
    if (typeof owner.email === 'string' && owner.email.trim()) return owner.email.trim();
    return 'Sin owner';
  }

  getOwnerEmail(project: ProjectDto): string {
    const owner = project?.owner as unknown as { email?: string } | string | null;
    if (!owner || typeof owner === 'string') return '';
    if (typeof owner.email === 'string' && owner.email.trim()) return owner.email.trim();
    return '';
  }

  getStatusClass(status: string | null | undefined): string {
    return this.normalizeStatus(status);
  }

  getStatusLabel(status: string | null | undefined): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'draft') return 'Borrador';
    if (normalized === 'in_progress') return 'En progreso';
    if (normalized === 'in_review') return 'En revision';
    if (normalized === 'completed') return 'Completado';
    if (normalized === 'archived') return 'Archivado';
    return String(status || 'N/A');
  }

  private normalizeStatus(status: string | null | undefined): StatusFilter {
    const raw = String(status || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_');

    if (raw === 'draft' || raw === 'borrador') return 'draft';
    if (raw === 'in_progress' || raw === 'inprogress' || raw === 'activo' || raw === 'active') {
      return 'in_progress';
    }
    if (raw === 'in_review' || raw === 'inreview' || raw === 'revision' || raw === 'en_revision') {
      return 'in_review';
    }
    if (raw === 'completed' || raw === 'complete' || raw === 'completado' || raw === 'done') {
      return 'completed';
    }
    if (raw === 'archived' || raw === 'archivado' || raw === 'closed') return 'archived';
    return 'draft';
  }

  trackByProjectId(_index: number, project: ProjectDto): string {
    return project.id;
  }
}
