import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminService,
  RoleUpgradeRequestItem,
  RoleUpgradeRequestStatus,
} from '../../../../core/data-access/admin.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-notifications">
      <div class="toolbar">
        <input
          type="text"
          [(ngModel)]="search"
          placeholder="Buscar por nombre o correo"
          (keyup.enter)="loadRequests()"
        />
        <select [(ngModel)]="statusFilter" (change)="loadRequests()">
          <option value="PENDING">Pendientes</option>
          <option value="ALL">Todas</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
        </select>
        <button class="btn" (click)="loadRequests()">Actualizar</button>
      </div>

      <div class="state-banner info" *ngIf="loading">Cargando solicitudes...</div>
      <div class="state-banner error" *ngIf="errorMessage">{{ errorMessage }}</div>
      <div class="state-banner success" *ngIf="successMessage">{{ successMessage }}</div>

      <div class="empty-state" *ngIf="!loading && !errorMessage && !requests.length">
        No hay solicitudes para mostrar.
      </div>

      <div class="request-list" *ngIf="!loading && requests.length">
        <article class="request-card" *ngFor="let req of requests; trackBy: trackById">
          <header>
            <div class="identity">
              <h3>{{ req.user?.name || 'Sin nombre' }}</h3>
              <p>{{ req.user?.email || 'Sin correo' }}</p>
            </div>
            <span class="status" [class]="statusClass(req.status)">{{ statusLabel(req.status) }}</span>
          </header>

          <div class="meta">
            <span>Solicitado: {{ req.createdAt | date:'short' }}</span>
            <span>Rol solicitado: {{ toRoleLabel(req.requestedRole) }}</span>
          </div>

          <p class="message" *ngIf="req.message">{{ req.message }}</p>
          <p class="message muted" *ngIf="!req.message">Sin mensaje del estudiante.</p>

          <div class="review-meta" *ngIf="req.adminNote || req.reviewedAt">
            <span *ngIf="req.reviewedAt">Revisado: {{ req.reviewedAt | date:'short' }}</span>
            <span *ngIf="req.adminNote">Nota admin: {{ req.adminNote }}</span>
          </div>

          <div class="actions" *ngIf="req.status === 'PENDING'">
            <button
              class="btn approve"
              [disabled]="processingId === req.id"
              (click)="resolve(req, 'APPROVE')">
              {{ processingId === req.id ? 'Procesando...' : 'Aprobar' }}
            </button>
            <button
              class="btn reject"
              [disabled]="processingId === req.id"
              (click)="resolve(req, 'REJECT')">
              {{ processingId === req.id ? 'Procesando...' : 'Rechazar' }}
            </button>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .admin-notifications {
      display: grid;
      gap: 0.95rem;
    }

    .toolbar {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .toolbar input,
    .toolbar select {
      border: 1px solid var(--slate-300);
      border-radius: 10px;
      padding: 0.55rem 0.75rem;
      background: var(--card-bg, #fff);
      color: var(--slate-800);
      min-width: 220px;
    }

    .btn {
      border: 1px solid var(--slate-300);
      background: var(--card-bg, #fff);
      color: var(--slate-800);
      border-radius: 10px;
      padding: 0.55rem 0.85rem;
      cursor: pointer;
      font-weight: 600;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn.approve {
      border-color: #86efac;
      color: #166534;
      background: #f0fdf4;
    }

    .btn.reject {
      border-color: #fecaca;
      color: #991b1b;
      background: #fef2f2;
    }

    .state-banner {
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-weight: 600;
      border: 1px solid transparent;
    }

    .state-banner.info {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .state-banner.error {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .state-banner.success {
      background: #ecfdf5;
      color: #166534;
      border-color: #86efac;
    }

    .empty-state {
      background: var(--card-bg, #fff);
      border: 1px dashed var(--slate-300);
      color: var(--slate-600);
      border-radius: 12px;
      padding: 1rem;
      font-weight: 600;
    }

    .request-list {
      display: grid;
      gap: 0.9rem;
    }

    .request-card {
      background: var(--card-bg, #fff);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 0.9rem 1rem;
      box-shadow: var(--shadow-card);
      color: var(--slate-800);
      display: grid;
      gap: 0.6rem;
    }

    .request-card header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    .identity h3 {
      margin: 0;
      font-size: 1rem;
    }

    .identity p {
      margin: 0.15rem 0 0;
      color: var(--slate-600);
      font-size: 0.9rem;
    }

    .status {
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .status.pending {
      color: #92400e;
      background: #fffbeb;
      border-color: #fcd34d;
    }

    .status.approved {
      color: #166534;
      background: #f0fdf4;
      border-color: #86efac;
    }

    .status.rejected {
      color: #991b1b;
      background: #fef2f2;
      border-color: #fecaca;
    }

    .meta,
    .review-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      color: var(--slate-600);
      font-size: 0.84rem;
    }

    .message {
      margin: 0;
      color: var(--slate-700);
      font-size: 0.92rem;
    }

    .message.muted {
      color: var(--slate-500);
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 0.55rem;
      justify-content: flex-end;
    }
  `],
})
export class AdminNotificationsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';
  search = '';
  statusFilter: RoleUpgradeRequestStatus | 'ALL' = 'PENDING';
  processingId: string | null = null;
  requests: RoleUpgradeRequestItem[] = [];

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService
      .getRoleUpgradeRequests({
        status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
        search: this.search.trim() || undefined,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (res) => {
          this.requests = res.items || [];
          this.loading = false;
        },
        error: (err: unknown) => {
          this.errorMessage = this.toFriendlyErrorMessage(err, 'No se pudieron cargar las solicitudes.');
          this.loading = false;
        },
      });
  }

  resolve(req: RoleUpgradeRequestItem, decision: 'APPROVE' | 'REJECT'): void {
    const note = window.prompt(
      decision === 'APPROVE' ? 'Nota opcional para aprobar:' : 'Nota opcional para rechazar:'
    );

    this.processingId = req.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.resolveRoleUpgradeRequest(req.id, decision, note || undefined).subscribe({
      next: () => {
        this.processingId = null;
        this.successMessage =
          decision === 'APPROVE'
            ? 'Solicitud aprobada. El usuario ahora es docente.'
            : 'Solicitud rechazada correctamente.';
        this.loadRequests();
      },
      error: (err: unknown) => {
        this.verifyResolutionAfterError(req.id, decision, err);
      },
    });
  }

  private verifyResolutionAfterError(
    requestId: string,
    decision: 'APPROVE' | 'REJECT',
    originalError: unknown,
  ): void {
    const expectedStatus: RoleUpgradeRequestStatus =
      decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    this.adminService
      .getRoleUpgradeRequests({
        status: undefined,
        page: 1,
        pageSize: 200,
      })
      .subscribe({
        next: (res) => {
          this.processingId = null;
          const latest = (res.items || []).find((item) => item.id === requestId);
          const wasApplied = latest?.status === expectedStatus;

          if (wasApplied) {
            this.successMessage =
              decision === 'APPROVE'
                ? 'Solicitud aprobada. El usuario ahora es docente.'
                : 'Solicitud rechazada correctamente.';
            this.errorMessage = '';
            this.loadRequests();
            return;
          }

          this.errorMessage = this.toFriendlyErrorMessage(
            originalError,
            'No se pudo procesar la solicitud.',
          );
        },
        error: () => {
          this.processingId = null;
          this.errorMessage = this.toFriendlyErrorMessage(
            originalError,
            'No se pudo procesar la solicitud.',
          );
        },
      });
  }

  private toFriendlyErrorMessage(err: unknown, fallback: string): string {
    const raw =
      (err as { error?: { message?: string }; message?: string })?.error?.message ||
      (err as { message?: string })?.message ||
      '';

    const message = String(raw || '').trim();
    if (!message) return fallback;

    const lower = message.toLowerCase();
    if (lower.includes('http failure response for')) return fallback;
    if (lower.includes('internal server error')) return fallback;
    if (lower.includes('error interno del servidor')) return fallback;

    return message;
  }

  statusLabel(status: RoleUpgradeRequestStatus): string {
    if (status === 'APPROVED') return 'Aprobada';
    if (status === 'REJECTED') return 'Rechazada';
    return 'Pendiente';
  }

  statusClass(status: RoleUpgradeRequestStatus): string {
    if (status === 'APPROVED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    return 'pending';
  }

  toRoleLabel(roleName: string): string {
    const role = String(roleName || '').toLowerCase();
    if (role === 'docente' || role === 'professor' || role === 'profesor') return 'Docente';
    if (role === 'admin') return 'Admin';
    if (role === 'estudiante' || role === 'student' || role === 'colaborador' || role === 'user') return 'Estudiante';
    return roleName || 'Sin rol';
  }

  trackById(_index: number, req: RoleUpgradeRequestItem): string {
    return req.id;
  }
}
