import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../../core/data-access/project.service';
import { AdminService } from '../../../../core/data-access/admin.service';
import { ProjectDto } from '../../../../core/models/project.models';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-projects">
      <div class="toolbar">
        <h2>Gestión de Proyectos (Control)</h2>
        <div class="filters">
           <select><option>Todos los Estados</option></select>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Owner</th>
              <th>Estado Actual</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of projects; trackBy: trackByProjectId">
              <td>
                 <strong>{{ p.title }}</strong>
                 <br><small class="text-muted">ID: {{ p.id }}</small>
              </td>
              <td>
                <div class="owner-cell">
                  <span class="owner-name">{{ getOwnerName(p) }}</span>
                  <small class="owner-email" *ngIf="getOwnerEmail(p)">{{ getOwnerEmail(p) }}</small>
                </div>
              </td>
              <td>
                <span class="badge" [class]="getStatusClass(p.status)">{{ p.status || 'N/A' }}</span>
              </td>
              <td>
                <div class="controls">
                   <button class="btn-sm btn-outline" (click)="forceStatus(p)">Forzar Estado</button>
                   <button class="btn-sm btn-outline danger" (click)="archiveProject(p)">Archivar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!projects.length">
              <td colspan="4" class="empty-state">No hay proyectos para mostrar.</td>
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
    
    .controls { display: flex; gap: 0.5rem; }
    .btn-sm { font-size: 0.75rem; padding: 0.3rem 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; }
    .btn-sm.danger { color: #991b1b; border-color: #fca5a5; }
    .btn-sm.danger:hover { background: #fef2f2; }
    .empty-state { text-align: center; color: #64748b; }
  `]
})
export class AdminProjectsComponent implements OnInit {
  projects: ProjectDto[] = [];
  loading = false;

  constructor(
    private projectService: ProjectService,
    private adminService: AdminService
  ) { }

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectService.getAllProjects().subscribe({
      next: (projects: ProjectDto[]) => {
        this.projects = Array.isArray(projects) ? projects : [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading projects:', err);
        this.loading = false;
      }
    });
  }

  forceStatus(project: any) {
    const newStatus = prompt(`Forzar estado de "${project.title}" a:`, 'completed');
    if (!newStatus) return;

    const reason = prompt('Razón del cambio forzado:', 'Cambio administrativo');
    if (!reason) return;

    this.projectService.forceStatusChange(project.id, newStatus, reason).subscribe({
      next: () => {
        alert(`Estado cambiado a: ${newStatus}`);
        this.loadProjects();
      },
      error: (err: any) => {
        console.error('Error forcing status:', err);
        alert('Error al forzar estado');
      }
    });
  }

  archiveProject(project: any) {
    const reason = prompt(`¿Archivar proyecto "${project.title}"? Ingresa la razón:`, 'Proyecto finalizado');
    if (!reason) return;

    this.projectService.archiveProject(project.id, reason).subscribe({
      next: () => {
        alert('Proyecto archivado exitosamente');
        this.loadProjects();
      },
      error: (err: any) => {
        console.error('Error archiving project:', err);
        alert('Error al archivar proyecto');
      }
    });
  }

  getOwnerName(project: ProjectDto): string {
    const owner = project?.owner as any;
    if (!owner) return 'Sin owner';
    if (typeof owner === 'string') return owner;
    if (typeof owner?.name === 'string' && owner.name.trim()) return owner.name.trim();
    if (typeof owner?.email === 'string' && owner.email.trim()) return owner.email.trim();
    return 'Sin owner';
  }

  getOwnerEmail(project: ProjectDto): string {
    const owner = project?.owner as any;
    if (!owner || typeof owner === 'string') return '';
    if (typeof owner?.email === 'string' && owner.email.trim()) return owner.email.trim();
    return '';
  }

  getStatusClass(status: string | null | undefined): string {
    return String(status || '').toLowerCase();
  }

  trackByProjectId(_index: number, project: ProjectDto): string {
    return project.id;
  }
}
