import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ProjectAccessService,
    ProjectAccessDto,
    ProjectPermission,
    AccessStatus,
} from '../../core/data-access/project-access.service';

@Component({
    selector: 'app-access-request-button',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="access-request-container">
      <!-- No solicitado aún -->
      <button
        *ngIf="!currentPermission"
        class="btn btn-access-request"
        (click)="showRequestDialog = true">
        🔒 Solicitar acceso
      </button>

      <!-- Solicitud pendiente -->
      <div *ngIf="currentPermission?.status === 'PENDING'" class="badge badge-pending">
        ⏳ Solicitud pendiente
      </div>

      <!-- Aprobado VIEW -->
      <div *ngIf="currentPermission?.status === 'APPROVED' && currentPermission?.permission === 'VIEW'" class="badge badge-view">
        👁️ Acceso de lectura
      </div>

      <!-- Aprobado EDIT -->
      <div *ngIf="currentPermission?.status === 'APPROVED' && currentPermission?.permission === 'EDIT'" class="badge badge-edit">
        ✏️ Acceso de edición
      </div>

      <!-- Rechazado -->
      <div *ngIf="currentPermission?.status === 'REJECTED'" class="rejected-container">
        <div class="badge badge-rejected">❌ Solicitud rechazada</div>
        <button class="btn btn-retry" (click)="showRequestDialog = true">
          Volver a solicitar
        </button>
      </div>

      <!-- Revocado -->
      <div *ngIf="currentPermission?.status === 'REVOKED'" class="revoked-container">
        <div class="badge badge-revoked">🚫 Acceso revocado</div>
        <button class="btn btn-retry" (click)="showRequestDialog = true">
          Solicitar nuevamente
        </button>
      </div>

      <!-- Dialog de solicitud -->
      <div *ngIf="showRequestDialog" class="dialog-overlay" (click)="showRequestDialog = false">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <h3>Solicitar acceso al proyecto</h3>
          
          <div class="form-group">
            <label>Tipo de permiso</label>
            <select [(ngModel)]="selectedPermission" class="form-control">
              <option value="VIEW">Solo lectura (VIEW)</option>
              <option value="EDIT">Edición (EDIT)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Nota (opcional)</label>
            <textarea
              [(ngModel)]="requestNotes"
              class="form-control"
              rows="3"
              placeholder="Explica por qué necesitas acceso..."></textarea>
          </div>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" (click)="showRequestDialog = false">
              Cancelar
            </button>
            <button
              class="btn btn-primary"
              (click)="submitRequest()"
              [disabled]="submitting">
              {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .access-request-container {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-access-request {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-access-request:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-retry {
      background: white;
      border: 1px solid var(--slate-300);
      color: var(--slate-700);
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .btn-retry:hover {
      background: var(--slate-50);
    }

    .badge {
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-view {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-edit {
      background: #dcfce7;
      color: #166534;
    }

    .badge-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-revoked {
      background: #f3f4f6;
      color: #6b7280;
    }

    .rejected-container,
    .revoked-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Dialog */
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .dialog-content h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: var(--slate-800);
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--slate-700);
      margin-bottom: 0.4rem;
    }

    .form-control {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--slate-300);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.9rem;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-600);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      border: 1px solid var(--slate-300);
      color: var(--slate-700);
    }

    .btn-secondary:hover {
      background: var(--slate-50);
    }

    .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
  `],
})
export class AccessRequestButtonComponent implements OnInit {
    @Input() projectId!: string;
    @Input() currentPermission?: ProjectAccessDto | null;
    @Output() onRequest = new EventEmitter<void>();

    showRequestDialog = false;
    selectedPermission: ProjectPermission = 'VIEW';
    requestNotes = '';
    submitting = false;
    error = '';

    constructor(private projectAccessService: ProjectAccessService) { }

    ngOnInit() {
        // Si hay permiso actual, pre-seleccionar el mismo tipo
        if (this.currentPermission) {
            this.selectedPermission = this.currentPermission.permission;
        }
    }

    submitRequest() {
        this.submitting = true;
        this.error = '';

        this.projectAccessService
            .requestAccess(this.projectId, {
                permission: this.selectedPermission,
                notes: this.requestNotes || undefined,
            })
            .subscribe({
                next: (access) => {
                    this.currentPermission = access;
                    this.showRequestDialog = false;
                    this.requestNotes = '';
                    this.submitting = false;
                    this.onRequest.emit();
                },
                error: (err) => {
                    this.error = err.error?.message || 'Error al enviar solicitud';
                    this.submitting = false;
                },
            });
    }
}
