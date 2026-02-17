import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectService } from '../../core/data-access/project.service';
import { EvidenceService } from '../../core/data-access/evidence.service';
import { SessionService } from '../../core/auth/data-access/session.service';
import { ProjectDto, EvidenceDto } from '../../core/models/project.models';

@Component({
  selector: 'app-folders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="folders-page">
      <header class="page-header">
        <div class="header-row">
          <div>
            <h1>{{ currentProjectId ? 'Explorador de Archivos' : 'Carpetas' }}</h1>
            <p class="subtitle">
              {{ currentProjectId ? 'Navega por carpetas y archivos del proyecto' : 'Explora los archivos organizados por proyecto.' }}
            </p>
          </div>

          <div *ngIf="currentProjectId && isAdmin" class="header-actions">
            <button class="btn btn-ghost" (click)="createFolder()">
              + Nueva carpeta
            </button>
            <button class="btn btn-primary" (click)="fileInput.click()">
              Subir documento
            </button>
            <input
              #fileInput
              type="file"
              class="hidden-input"
              (change)="onFilesSelected($event)"
              multiple
            />
          </div>
        </div>
      </header>

      <!-- Breadcrumbs -->
      <div *ngIf="currentProjectId" class="breadcrumbs-container">
        <div class="breadcrumbs">
          <span
            *ngFor="let crumb of breadcrumbs; let last = last"
            class="crumb"
            [class.active]="last"
            (click)="!last && goToCrumb(crumb.id)">
            {{ crumb.name }}
            <span *ngIf="!last" class="separator">/</span>
          </span>
        </div>
        <button *ngIf="breadcrumbs.length > 1" class="back-btn" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Volver
        </button>
      </div>

      <div *ngIf="errorMessage && !loading" class="error-banner">
        {{ errorMessage }}
      </div>

      <!-- Vista de proyectos (cuando no hay proyecto seleccionado) -->
      <div *ngIf="!currentProjectId" class="grid-container">
        <div
          *ngFor="let project of projects"
          class="card project-card"
          (click)="openProject(project.id)">
          <div class="card-icon project-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">{{ project.title }}</span>
            <span class="card-meta">{{ project.updatedAt | date:'mediumDate' }}</span>
          </div>
        </div>

        <div *ngIf="projects.length === 0 && !loading" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <p>No hay proyectos disponibles.</p>
        </div>
      </div>

      <!-- Vista de archivos y carpetas (cuando hay proyecto seleccionado) -->
      <div *ngIf="currentProjectId" class="grid-container">
        <div
          *ngFor="let item of items"
          class="card item-card"
          [class.is-folder]="item.isFolder"
          (click)="item.isFolder ? navigateToFolder(item) : openFile(item)">
          <div class="card-icon item-icon">
            <!-- Folder Icon -->
            <svg *ngIf="item.isFolder" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class="icon-folder">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <!-- File Icon (Generic) -->
            <svg *ngIf="!item.isFolder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" class="icon-file">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">{{ item.title }}</span>
            <span class="card-meta">
              {{ item.isFolder ? 'Carpeta' : (item.mimeType || 'Archivo') }}
              • {{ item.updatedAt | date:'shortDate' }}
            </span>
          </div>
        </div>

        <div *ngIf="items.length === 0 && !loading" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <p>Esta carpeta está vacía.</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando contenido...</p>
      </div>
    </div>
  `,
  styles: [`
    .folders-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .btn {
      border-radius: 12px;
      padding: 0.6rem 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
      box-shadow: 0 10px 22px rgba(102, 126, 234, 0.25);
    }

    .btn-primary:hover {
      filter: brightness(0.98);
      transform: translateY(-1px);
    }

    .btn-ghost {
      background: white;
      border-color: rgba(15, 23, 42, 0.12);
      color: var(--slate-800);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
    }

    .btn-ghost:hover {
      background: var(--slate-50);
      transform: translateY(-1px);
    }

    .hidden-input { display: none; }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--slate-500);
      font-size: 0.95rem;
    }

    /* GRID LAYOUT */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    /* CARDS */
    .card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary-200);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--slate-50);
      color: var(--slate-500);
    }
    
    .project-icon {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .is-folder .item-icon {
      background: #eff6ff;
      color: #3b82f6;
    }

    .icon-folder {
      fill: currentColor;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
    }

    .card-title {
      font-weight: 600;
      color: var(--slate-900);
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .card-meta {
      font-size: 0.8rem;
      color: var(--slate-500);
    }

    /* BREADCRUMBS */
    .breadcrumbs-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 0.75rem 1rem;
      background: var(--slate-50);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--slate-200);
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .crumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--slate-500);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .crumb.active {
      color: var(--slate-900);
      font-weight: 600;
      cursor: default;
    }

    .crumb:not(.active):hover {
      color: var(--primary-600);
    }

    .separator {
      color: var(--slate-300);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid var(--slate-300);
      color: var(--slate-700);
      border-radius: var(--border-radius-sm);
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: var(--slate-50);
      border-color: var(--slate-400);
    }

    .error-banner {
      margin: 0.5rem 0 1.5rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid rgba(239, 68, 68, 0.25);
      background: rgba(239, 68, 68, 0.08);
      color: rgba(127, 29, 29, 0.95);
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* EMPTY STATE */
    .empty-state {
      grid-column: 1 / -1;
      padding: 4rem 1rem;
      text-align: center;
      color: var(--slate-400);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    /* LOADING */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--slate-500);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class FoldersComponent implements OnInit {
  projects: ProjectDto[] = [];
  loading = true;
  errorMessage: string | null = null;
  isAdmin = false;
  
  // Estado para navegación de carpetas
  currentFolderId: string | null = null;
  items: EvidenceDto[] = [];
  breadcrumbs: { id: string | null, name: string }[] = [{ id: null, name: 'Inicio' }];
  currentProjectId: string | null = null;

  constructor(
    private projectService: ProjectService,
    private evidenceService: EvidenceService,
    private SessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.SessionService.getRole();
    this.isAdmin = !!role && String(role).toLowerCase() === 'admin';

    this.projectService.getMyProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      }
    });
  }

  openProject(id: string): void {
    this.currentProjectId = id;
    this.currentFolderId = null;
    this.breadcrumbs = [{ id: null, name: 'Inicio' }, { id: null, name: this.getProjectName(id) }];
    this.loadFolderContents(null);
  }

  private getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.title || 'Proyecto';
  }

  loadFolderContents(folderId: string | null): void {
    if (!this.currentProjectId) return;
    
    this.loading = true;
    this.evidenceService.getFiles(this.currentProjectId, folderId).subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      }
    });
  }

  createFolder(): void {
    if (!this.currentProjectId) return;

    const name = prompt('Nombre de la nueva carpeta:');
    if (!name?.trim()) return;

    this.loading = true;
    this.evidenceService.createFolder({
      projectId: this.currentProjectId,
      parentId: this.currentFolderId,
      name: name.trim(),
    }).subscribe({
      next: () => this.loadFolderContents(this.currentFolderId),
      error: (err) => {
        this.loading = false;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error creando carpeta');
      }
    });
  }

  async onFilesSelected(event: Event): Promise<void> {
    if (!this.currentProjectId) return;

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';

    if (files.length === 0) return;

    // Límite suave para evitar colgar la UI (base64 en memoria)
    const maxBytes = 8 * 1024 * 1024; // 8MB
    const tooBig = files.find(f => f.size > maxBytes);
    if (tooBig) {
      this.errorMessage = `El archivo "${tooBig.name}" es demasiado grande (máx 8MB).`;
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    try {
      for (const file of files) {
        await this.evidenceService.createFile({
          projectId: this.currentProjectId,
          parentId: this.currentFolderId,
          name: file.name,
          file,
        }).toPromise();
      }

      this.loadFolderContents(this.currentFolderId);
    } catch (err: any) {
      this.loading = false;
      this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error subiendo archivo');
    }
  }

  navigateToFolder(folder: EvidenceDto): void {
    if (!folder.isFolder) return;
    
    this.currentFolderId = folder.id;
    this.breadcrumbs.push({ id: folder.id, name: folder.title });
    this.loadFolderContents(folder.id);
  }

  goBack(): void {
    if (this.breadcrumbs.length <= 2) {
      // Si solo hay Inicio y Proyecto, volver a la vista de proyectos
      this.currentProjectId = null;
      this.currentFolderId = null;
      this.items = [];
      this.breadcrumbs = [{ id: null, name: 'Inicio' }];
    } else {
      // Retroceder un nivel
      this.breadcrumbs.pop();
      const previous = this.breadcrumbs[this.breadcrumbs.length - 1];
      this.currentFolderId = previous.id;
      this.loadFolderContents(previous.id);
    }
  }

  goToCrumb(crumbId: string | null): void {
    if (crumbId === null) {
      // Volver a la raíz del proyecto
      this.currentFolderId = null;
      this.breadcrumbs = this.breadcrumbs.slice(0, 2);
      this.loadFolderContents(null);
    } else {
      // Navegar a un crumb específico
      const index = this.breadcrumbs.findIndex(c => c.id === crumbId);
      if (index !== -1) {
        this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
        this.currentFolderId = crumbId;
        this.loadFolderContents(crumbId);
      }
    }
  }

  openFile(item: EvidenceDto): void {
    // Por ahora solo navega al detalle de evidencia
    this.router.navigate(['/projects', this.currentProjectId, 'evidence', item.id]);
  }
}

