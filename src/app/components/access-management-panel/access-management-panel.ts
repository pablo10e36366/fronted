import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ProjectAccessService,
    ProjectAccessDto,
    AccessStatus,
    ProjectPermission,
} from '../../core/data-access/project-access.service';

@Component({
    selector: 'app-access-management-panel',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="access-panel" *ngIf="forceVisible || (pendingRequests.length > 0 || activePermissions.length > 0)">
      <h3>🔐 Control de Acceso</h3>

      <!-- Solicitudes pendientes -->
      <div *ngIf="pendingRequests.length > 0" class="section">
        <h4>Solicitudes Pendientes ({{ pendingRequests.length }})</h4>
        <div class="requests-list">
          <div *ngFor="let request of pendingRequests" class="request-card">
            <div class="request-header">
              <div class="user-info">
                <strong>{{ request.user?.name || 'Usuario' }}</strong>
                <span class="email">{{ request.user?.email }}</span>
              </div>
              <span class="permission-badge" [class]="'badge-' + request.permission.toLowerCase()">
                {{ request.permission === 'VIEW' ? '👁️ Lectura' : '✏️ Edición' }}
              </span>
            </div>

            <div *ngIf="request.notes" class="request-notes">
              "{{ request.notes }}"
            </div>

            <div class="request-meta">
              Solicitado: {{ request.requestedAt | date:'short' }}
            </div>

            <div class="request-actions">
              <button
                class="btn btn-approve"
                (click)="approveRequest(request)"
                [disabled]="processing === request.id">
                {{ processing === request.id ? '⏳' : '✅' }} Aprobar
              </button>
              <button
                class="btn btn-reject"
                (click)="rejectRequest(request)"
                [disabled]="processing === request.id">
                {{ processing === request.id ? '⏳' : '❌' }} Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Permisos activos -->
      <div *ngIf="activePermissions.length > 0" class="section">
        <h4>Usuarios con Acceso ({{ activePermissions.length }})</h4>
        <div class="permissions-list">
          <div *ngFor="let permission of activePermissions" class="permission-card">
            <div class="permission-header">
              <div class="user-info">
                <strong>{{ permission.user?.name || 'Usuario' }}</strong>
                <span class="email">{{ permission.user?.email }}</span>
              </div>
              <div class="permission-controls">
                <select
                  class="permission-select"
                  [value]="permission.permission"
                  (change)="changePermission(permission, $event)"
                  [disabled]="processing === permission.id">
                  <option value="VIEW">👁️ Lectura</option>
                  <option value="EDIT">✏️ Edición</option>
                </select>
                <button
                  class="btn btn-revoke"
                  (click)="revokePermission(permission)"
                  [disabled]="processing === permission.id">
                  🚫 Revocar
                </button>
              </div>
            </div>

            <div class="permission-meta">
              Aprobado: {{ permission.resolvedAt | date:'short' }}
              <span *ngIf="permission.grantedBy">
                por {{ permission.grantedBy.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="pendingRequests.length === 0 && activePermissions.length === 0" class="empty-state">
        No hay solicitudes pendientes ni permisos activos.
      </div>

      <div *ngIf="error" class="error-message">{{ error }}</div>
      <div *ngIf="message" class="success-message">{{ message }}</div>
    </div>
  `,
    styles: [`
    .access-panel {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .access-panel h3 {
      margin: 0 0 1.5rem;
      color: var(--slate-800);
      font-size: 1.1rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section h4 {
      margin: 0 0 1rem;
      color: var(--slate-600);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .requests-list,
    .permissions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .request-card,
    .permission-card {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      padding: 1rem;
    }

    .request-header,
    .permission-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-info strong {
      color: var(--slate-800);
    }

    .user-info .email {
      font-size: 0.85rem;
      color: var(--slate-500);
    }

    .permission-badge {
      padding: 0.35rem 0.7rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .badge-view {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-edit {
      background: #dcfce7;
      color: #166534;
    }

    .request-notes {
      background: white;
      padding: 0.75rem;
      border-radius: 6px;
      font-style: italic;
      color: var(--slate-600);
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .request-meta,
    .permission-meta {
      font-size: 0.8rem;
      color: var(--slate-500);
      margin-bottom: 0.75rem;
    }

    .request-actions {
      display: flex;
      gap: 0.5rem;
    }

    .permission-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .permission-select {
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--slate-300);
      border-radius: 6px;
      font-size: 0.85rem;
      background: white;
      cursor: pointer;
    }

    .permission-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-approve {
      background: #dcfce7;
      color: #166534;
    }

    .btn-approve:hover:not(:disabled) {
      background: #bbf7d0;
    }

    .btn-reject {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-reject:hover:not(:disabled) {
      background: #fecaca;
    }

    .btn-revoke {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.4rem 0.8rem;
    }

    .btn-revoke:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 1rem;
      font-size: 0.9rem;
    }

    .success-message {
      background: #dcfce7;
      color: #166534;
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 1rem;
      font-size: 0.9rem;
    }

    .empty-state {
      padding: 0.75rem 0;
      color: var(--slate-500);
      font-size: 0.9rem;
    }
  `],
})
export class AccessManagementPanelComponent implements OnInit {
    @Input() projectId!: string;
    @Input() forceVisible: boolean = false;
    @Output() onUpdate = new EventEmitter<void>();

    pendingRequests: ProjectAccessDto[] = [];
    activePermissions: ProjectAccessDto[] = [];
    processing: string | null = null;
    error = '';
    message = '';

    constructor(private projectAccessService: ProjectAccessService) { }

    ngOnInit() {
        this.loadPermissions();
    }

    loadPermissions() {
        // Cargar solicitudes pendientes
        this.projectAccessService.getProjectAccess(this.projectId, 'PENDING').subscribe({
            next: (requests) => {
                this.pendingRequests = requests;
            },
            error: (err) => {
                console.error('Error loading pending requests:', err);
                this.error = err.error?.message || 'No se pudieron cargar las solicitudes de acceso.';
            },
        });

        // Cargar permisos aprobados
        this.projectAccessService.getProjectAccess(this.projectId, 'APPROVED').subscribe({
            next: (permissions) => {
                this.activePermissions = permissions;
            },
            error: (err) => {
                console.error('Error loading active permissions:', err);
                this.error = err.error?.message || 'No se pudieron cargar los permisos de acceso.';
            },
        });
    }

    approveRequest(request: ProjectAccessDto) {
        this.processing = request.id;
        this.error = '';
        this.message = '';

        this.projectAccessService
            .respondToRequest(this.projectId, request.id, { action: 'APPROVED' })
            .subscribe({
                next: () => {
                    this.message = `Acceso aprobado para ${request.user?.name}`;
                    this.processing = null;
                    this.loadPermissions();
                    this.onUpdate.emit();
                    setTimeout(() => (this.message = ''), 3000);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Error al aprobar solicitud';
                    this.processing = null;
                },
            });
    }

    rejectRequest(request: ProjectAccessDto) {
        if (!confirm(`¿Rechazar solicitud de ${request.user?.name}?`)) {
            return;
        }

        this.processing = request.id;
        this.error = '';
        this.message = '';

        this.projectAccessService
            .respondToRequest(this.projectId, request.id, { action: 'REJECTED' })
            .subscribe({
                next: () => {
                    this.message = `Solicitud rechazada`;
                    this.processing = null;
                    this.loadPermissions();
                    this.onUpdate.emit();
                    setTimeout(() => (this.message = ''), 3000);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Error al rechazar solicitud';
                    this.processing = null;
                },
            });
    }

    changePermission(permission: ProjectAccessDto, event: Event) {
        const newPermission = (event.target as HTMLSelectElement).value as ProjectPermission;
        if (newPermission === permission.permission) {
            return;
        }

        this.processing = permission.id;
        this.error = '';
        this.message = '';

        this.projectAccessService
            .changePermission(this.projectId, permission.id, { permission: newPermission })
            .subscribe({
                next: () => {
                    this.message = `Permiso actualizado para ${permission.user?.name}`;
                    this.processing = null;
                    this.loadPermissions();
                    this.onUpdate.emit();
                    setTimeout(() => (this.message = ''), 3000);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Error al cambiar permiso';
                    this.processing = null;
                    // Revertir el valor del select
                    (event.target as HTMLSelectElement).value = permission.permission;
                },
            });
    }

    revokePermission(permission: ProjectAccessDto) {
        if (!confirm(`¿Revocar acceso de ${permission.user?.name}?`)) {
            return;
        }

        this.processing = permission.id;
        this.error = '';
        this.message = '';

        this.projectAccessService.revokeAccess(this.projectId, permission.userId).subscribe({
            next: () => {
                this.message = `Acceso revocado para ${permission.user?.name}`;
                this.processing = null;
                this.loadPermissions();
                this.onUpdate.emit();
                setTimeout(() => (this.message = ''), 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Error al revocar acceso';
                this.processing = null;
            },
        });
    }
}
