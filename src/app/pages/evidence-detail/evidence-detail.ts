import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EvidenceDto, EvidenceStatus } from '../../core/models/project.models';
import { EvidenceService } from '../../core/data-access/evidence.service';
import { SessionService } from '../../core/auth/data-access/session.service';
import { CollaborativeEditorComponent } from '../../components/collaborative-editor/collaborative-editor';
import { ProjectAccessService } from '../../core/data-access/project-access.service';

@Component({
  selector: 'app-evidence-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CollaborativeEditorComponent
  ],
  template: `
    <div class="detail-page" *ngIf="evidence">
      
      <!-- Top Navigation -->
      <nav class="top-nav">
        <button class="btn-back" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Volver
        </button>
        <div class="breadcrumbs">
          <span class="crumb">{{ evidence.title }}</span>
        </div>
        <div class="actions">
          <span class="status-badge" [ngClass]="getStatusClass()">
            {{ getStatusText() }}
          </span>
        </div>
      </nav>

      <div class="content-layout">
        
        <!-- MAIN CONTENT -->
        <main class="main-column">
          <div class="card evidence-card">
            <div class="card-header">
              <h2>Contenido</h2>
              <div class="card-actions" *ngIf="evidence.type === 'TEXT' && !isEditing && !isAdmin">
                <button class="btn btn-sm btn-secondary" (click)="startEditing()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Editar
                </button>
              </div>
            </div>

            <div class="card-body">
              <!-- LINK -->
              <ng-container *ngIf="evidence.type === 'LINK'">
                <div class="link-display">
                  <div class="link-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </div>
                  <div class="link-info">
                    <span class="label">Enlace externo</span>
                    <a [href]="evidence.url" target="_blank" class="link-url">{{ evidence.url }}</a>
                  </div>
                </div>
              </ng-container>

              <!-- TEXT / EDITOR -->
              <ng-container *ngIf="evidence.type === 'TEXT'">
                <div *ngIf="!isEditing" class="text-display">
                  {{ evidence.description || 'Sin contenido.' }}
                </div>

                <div *ngIf="isEditing" class="editor-container">
                  <div *ngIf="!hasLock && lockOwner" class="lock-alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>Bloqueado por {{ lockOwner.name }}</span>
                  </div>

                  <app-collaborative-editor
                    *ngIf="hasLock"
                    [evidenceId]="evidence.id"
                    [initialContent]="editContent"
                    [userRole]="getUserRole()"
                    [userName]="getUserName()"
                    [canEdit]="canEdit"
                    [close]="cancelEditingFn">
                  </app-collaborative-editor>

                  <div *ngIf="!hasLock" class="editor-locked-message">
                    No puedes editar este documento porque otro usuario tiene el bloqueo.
                  </div>
                </div>
              </ng-container>

              <!-- FILE -->
              <ng-container *ngIf="evidence.type === 'FILE'">
                <div class="file-display">
                  <div class="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ evidence.title }}</span>
                    <span class="file-url">{{ evidence.mimeType || 'Archivo' }}</span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    [disabled]="isDownloadingFile"
                    (click)="downloadFile()">
                    {{ isDownloadingFile ? 'Descargando...' : 'Descargar' }}
                  </button>
                </div>

                <div *ngIf="evidence.contentBlob && evidence.mimeType?.startsWith('image/')" class="file-preview">
                  <img [src]="evidence.contentBlob" [alt]="evidence.title || 'Imagen'" />
                </div>
              </ng-container>
            </div>
          </div>

          <!-- FEEDBACK SECTION -->
          <div class="card feedback-card" *ngIf="evidence.feedback">
            <div class="card-header feedback-header" [class]="evidence.status">
              <h3>Retroalimentación del Supervisor</h3>
            </div>
            <div class="card-body">
              <p class="feedback-text">{{ evidence.feedback }}</p>
              <span class="feedback-date">Actualizado: {{ evidence.updatedAt | date:'medium' }}</span>
            </div>
          </div>
        </main>

        <!-- SIDEBAR METADATA & ACTIONS -->
        <aside class="sidebar-column">
          <!-- METADATA CARD -->
          <div class="card meta-card">
            <div class="card-header">
              <h3>Detalles</h3>
            </div>
            <div class="card-body meta-list">
              <div class="meta-row">
                <span class="meta-label">Autor</span>
                <span class="meta-value">{{ evidence.author?.name || evidence.author?.email || 'Desconocido' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Creado</span>
                <span class="meta-value">{{ evidence.createdAt | date:'shortDate' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Tipo</span>
                <span class="meta-value badge-type">{{ evidence.type }}</span>
              </div>
            </div>
          </div>

          <!-- ADMIN REVIEW CARD -->
          <div class="card review-card" *ngIf="canReview && evidence.status !== 'APPROVED'">
            <div class="card-header">
              <h3>Revisión</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Observaciones</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="feedbackText"
                  rows="4"
                  placeholder="Escribe retroalimentación...">
                </textarea>
              </div>
              <div class="review-buttons">
                <button
                  class="btn btn-full btn-danger-outline"
                  (click)="submitReview('REJECTED')"
                  [disabled]="isSubmitting || !feedbackText.trim()">
                  Solicitar Cambios
                </button>
                <button
                  class="btn btn-full btn-success"
                  (click)="submitReview('APPROVED')"
                  [disabled]="isSubmitting">
                  Validar
                </button>
              </div>
            </div>
          </div>
        </aside>

      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="!evidence && !error">
        <div class="spinner"></div>
      </div>
      
      <!-- Error State -->
      <div class="error-container" *ngIf="error">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" (click)="goBack()">Volver</button>
      </div>
    </div>
  `,
  styles: [`
    .detail-page {
      min-height: 100vh;
      background-color: var(--slate-50);
      padding: 2rem;
    }

    /* TOP NAV */
    .top-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid var(--slate-300);
      color: var(--slate-700);
      padding: 0.5rem 0.75rem;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: var(--slate-50);
      border-color: var(--slate-400);
    }

    .breadcrumbs {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--slate-900);
    }

    /* LAYOUT */
    .content-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 1024px) {
      .content-layout {
        grid-template-columns: 1fr 300px;
      }
    }

    /* CARDS */
    .card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--slate-100);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-header h2, .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--slate-900);
    }

    .card-body {
      padding: 1.5rem;
    }

    /* STATUS BADGES */
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid transparent;
    }

    .status-badge.en-revision { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .status-badge.validado { background: #ecfdf5; color: #047857; border-color: #6ee7b7; }
    .status-badge.correcccion { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

    /* CONTENT TYPES */
    .link-display {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--slate-50);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--slate-200);
    }

    .link-icon {
      color: var(--primary-600);
    }

    .link-info {
      display: flex;
      flex-direction: column;
    }

    .link-url {
      color: var(--primary-600);
      font-weight: 500;
      text-decoration: none;
    }

    .link-url:hover { text-decoration: underline; }

    .text-display {
      padding: 1.5rem;
      background: var(--slate-50);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--slate-200);
      line-height: 1.6;
      white-space: pre-wrap;
      color: var(--slate-700);
    }

    .file-display {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--slate-50);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--slate-200);
    }

    .file-icon {
      color: var(--slate-500);
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 600;
      color: var(--slate-900);
    }

    .file-url {
      font-size: 0.8rem;
      color: var(--slate-500);
    }

    .file-preview {
      margin-top: 1rem;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      border: 1px solid var(--slate-200);
      background: white;
    }

    .file-preview img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    /* EDITOR */
    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .editor-textarea {
      width: 100%;
      min-height: 300px;
      padding: 1rem;
      border: 1px solid var(--slate-300);
      border-radius: var(--border-radius-md);
      font-family: monospace;
      font-size: 0.9rem;
      resize: vertical;
      outline: none;
    }

    .editor-textarea:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 2px var(--primary-100);
    }

    .editor-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .lock-alert {
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--border-radius-md);
      color: #b91c1c;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    /* SIDEBAR STYLES */
    .meta-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .meta-label { color: var(--slate-500); }
    .meta-value { font-weight: 500; color: var(--slate-900); }
    
    .badge-type {
      background: var(--slate-100);
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--slate-700);
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--slate-300);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      resize: vertical;
    }

    .review-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
    .btn-full { width: 100%; }

    .btn-primary { background: var(--primary-600); color: white; }
    .btn-primary:hover { background: var(--primary-700); }
    
    .btn-secondary { background: white; border-color: var(--slate-300); color: var(--slate-700); }
    .btn-secondary:hover { background: var(--slate-50); }

    .btn-success { background: var(--success-color); color: white; }
    .btn-success:hover { background: #059669; }

    .btn-danger-outline { background: white; border-color: #fecaca; color: #b91c1c; }
    .btn-danger-outline:hover { background: #fef2f2; }

    /* FEEDBACK */
    .feedback-card { border-left: 4px solid transparent; }
    .feedback-header.APPROVED { color: #047857; }
    .feedback-header.REJECTED { color: #b91c1c; }
    
    .feedback-text { color: var(--slate-700); line-height: 1.5; }
    .feedback-date { font-size: 0.75rem; color: var(--slate-400); margin-top: 1rem; display: block; }

    /* LOADING & ERROR */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-container {
      text-align: center;
      padding: 4rem;
      color: #b91c1c;
    }

    .editor-locked-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      margin-top: 1rem;
    }
  `]
})
export class EvidenceDetailComponent implements OnInit, OnDestroy {
  evidence: EvidenceDto | null = null;
  feedbackText: string = '';
  isSubmitting: boolean = false;
  error: string = '';
  isAdmin: boolean = false;
  canReview: boolean = false;
  isDownloadingFile: boolean = false;

  // Edición concurrente
  isEditing: boolean = false;
  editContent: string = '';
  lockInterval: any = null;
  lockOwner: { id: number; name: string; email: string } | null = null;
  hasLock: boolean = false;
  canEdit: boolean = true; // Permiso de edición (owner o EDIT permission)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evidenceService: EvidenceService,
    private SessionService: SessionService,
    private projectAccessService: ProjectAccessService
  ) { }

  ngOnInit(): void {
    const evidenceId = this.route.snapshot.paramMap.get('evidenceId');

    if (evidenceId) {
      this.loadEvidence(evidenceId);
    }

    // Check if user is admin or reviewer
    this.isAdmin = this.SessionService.hasRole('admin');
    const role = this.SessionService.getRole();
    this.canReview = role ? ['admin', 'professor', 'mentor'].includes(role) : false;
  }

  loadEvidence(evidenceId: string): void {
    this.evidenceService.getEvidenceById(evidenceId).subscribe({
      next: (data) => {
        this.evidence = data;
        this.error = '';
        // Verificar permisos del proyecto para determinar canEdit
        if (this.evidence?.projectId) {
          this.checkProjectPermissions(this.evidence.projectId);
        }
      },
      error: (err) => {
        this.error = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
        console.error('Error loading evidence:', err);
      }
    });
  }

  downloadFile(): void {
    if (!this.evidence || this.evidence.type !== 'FILE') return;

    // Si el archivo está embebido como data URL (imágenes), usamos eso.
    if (this.evidence.contentBlob) {
      const a = document.createElement('a');
      a.href = this.evidence.contentBlob;
      a.download = this.evidence.title || 'documento';
      a.click();
      return;
    }

    this.isDownloadingFile = true;
    this.evidenceService.downloadEvidenceFile(this.evidence.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.evidence?.title || 'documento';
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloadingFile = false;
      },
      error: (err) => {
        this.isDownloadingFile = false;
        this.error = (typeof err === 'string') ? err : (err?.message || 'Error descargando archivo');
      }
    });
  }

  getStatusClass(): string {
    if (!this.evidence) return '';
    switch (this.evidence.status) {
      case 'SUBMITTED': return 'en-revision';
      case 'APPROVED': return 'validado';
      case 'REJECTED': return 'correcccion';
      default: return '';
    }
  }

  getStatusText(): string {
    if (!this.evidence) return '';
    switch (this.evidence.status) {
      case 'SUBMITTED': return 'En Revisión';
      case 'APPROVED': return 'Validado';
      case 'REJECTED': return 'Corrección Solicitada';
      default: return this.evidence.status;
    }
  }

  submitReview(status: EvidenceStatus): void {
    if (!this.evidence) return;

    this.isSubmitting = true;
    this.evidenceService.reviewEvidence(this.evidence.id, status, this.feedbackText).subscribe({
      next: (updated) => {
        this.evidence = updated;
        this.isSubmitting = false;
        this.feedbackText = '';
        this.error = '';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
        console.error('Error reviewing evidence:', err);
      }
    });
  }

  goBack(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.router.navigate(['/projects', projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  checkProjectPermissions(projectId: string): void {
    // Por defecto, asumir que no puede editar
    this.canEdit = false;

    // Verificar si es el owner del proyecto consultando el servicio
    this.projectAccessService.checkMyPermission(projectId).subscribe({
      next: (result) => {
        // Si canEdit es true, significa que es owner o tiene permiso EDIT
        if (result.canEdit) {
          this.canEdit = true;
        } else if (result.canView && !result.canEdit) {
          // Solo tiene permiso VIEW, no puede editar
          this.canEdit = false;
        }
      },
      error: (err) => {
        console.error('Error checking permissions:', err);
        // Si hay error, por seguridad dejamos canEdit = false
        this.canEdit = false;
      }
    });
  }

  // --- Edición Concurrente ---

  startEditing(): void {
    if (!this.evidence || this.evidence.type !== 'TEXT') return;

    this.editContent = this.evidence.description || '';
    this.isEditing = true;

    // Intentar adquirir lock
    this.evidenceService.lockFile(this.evidence.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasLock = true;
          // Iniciar intervalo de renovación cada 25 segundos
          this.lockInterval = setInterval(() => {
            if (this.evidence) {
              this.evidenceService.lockFile(this.evidence.id).subscribe();
            }
          }, 25000);
        } else {
          // Lock pertenece a otro usuario
          this.hasLock = false;
          // Aquí deberíamos obtener información del lockOwner desde el backend
          // Por ahora mostramos un mensaje genérico
          this.lockOwner = { id: 0, name: 'Otro usuario', email: '' };
        }
      },
      error: (err) => {
        this.hasLock = false;
        this.isEditing = false;
        this.error = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      }
    });
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editContent = '';
    this.releaseLock();
  }

  saveContent(): void {
    if (!this.evidence || !this.editContent.trim()) return;

    this.isSubmitting = true;
    this.evidenceService.saveContent(this.evidence.id, this.editContent).subscribe({
      next: (updated) => {
        this.evidence = updated;
        this.isSubmitting = false;
        this.isEditing = false;
        this.releaseLock();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      }
    });
  }

  private releaseLock(): void {
    if (this.lockInterval) {
      clearInterval(this.lockInterval);
      this.lockInterval = null;
    }

    if (this.evidence && this.hasLock) {
      this.evidenceService.unlockFile(this.evidence.id).subscribe();
      this.hasLock = false;
    }
    this.lockOwner = null;
  }

  // Helper methods for collaborative editor
  getUserRole(): string {
    const role = this.SessionService.getRole();
    return role === 'professor' ? 'profesor' : 'student';
  }

  getUserName(): string {
    const user = this.SessionService.getUserFromToken();
    return user?.name || user?.email || 'Usuario';
  }

  // Arrow function to maintain 'this' context when passed as callback
  cancelEditingFn = () => {
    this.cancelEditing();
  };

  ngOnDestroy(): void {
    this.releaseLock();
  }
}

