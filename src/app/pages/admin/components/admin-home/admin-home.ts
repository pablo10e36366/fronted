import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import {
  AdminDashboardAlert,
  AdminDashboardStats,
  AdminService,
} from '../../../../core/data-access/admin.service';
import { ProjectService } from '../../../../core/data-access/project.service';
import type { ProjectDto } from '../../../../core/models/project.models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-home">
      <div class="state-banner info" *ngIf="loading">Cargando métricas del sistema...</div>
      <div class="state-banner error" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="kpi-grid" *ngIf="!loading">
        <div class="kpi-card users">
          <div class="icon">👥</div>
          <div class="value">{{ activeUsersCount }}</div>
          <div class="label">Usuarios Activos</div>
        </div>
        <div class="kpi-card projects">
          <div class="icon">🚀</div>
          <div class="value">{{ activeCoursesCount }}</div>
          <div class="label">Cursos Activos</div>
        </div>
      </div>

      <div *ngIf="!loading">
        <div class="alerts-section">
          <h3>Alertas Rápidas</h3>
          <div class="empty-alerts" *ngIf="!stats.alerts.length">Sin alertas por ahora.</div>
          <div class="alert-list" *ngIf="stats.alerts.length">
            <div class="alert-item" [class]="alert.type" *ngFor="let alert of stats.alerts">
              <span class="alert-icon">{{ getAlertIcon(alert.type) }}</span>
              <div class="alert-text">
                <strong>{{ alert.title }}</strong>
                <p>{{ alert.description }}</p>
              </div>
              <span class="alert-count">{{ alert.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-home {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.3rem;
    }

    .kpi-card {
      background: var(--card-bg, #fff);
      padding: 1.45rem;
      border-radius: 14px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--slate-200);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: box-shadow .2s ease, transform .2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
    }

    .kpi-card .icon {
      font-size: 2rem;
      margin-bottom: 0.35rem;
    }

    .kpi-card .value {
      font-size: 2.25rem;
      line-height: 1;
      font-weight: 800;
      color: var(--slate-900);
      margin-top: 0.35rem;
    }

    .kpi-card .label {
      color: var(--slate-600);
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 0.55rem;
    }

    .alerts-section {
      background: var(--card-bg, #fff);
      padding: 1.5rem;
      border-radius: 14px;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-card);
    }

    h3 {
      margin: 0 0 1.35rem;
      color: var(--slate-900);
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .empty-alerts {
      padding: 1rem;
      border-radius: 10px;
      background: var(--slate-100);
      color: var(--slate-700);
      border: 1px dashed var(--slate-300);
      font-weight: 600;
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .alert-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: start;
      gap: 0.75rem;
      padding: 0.95rem;
      border-radius: 10px;
      border: 1px solid transparent;
    }

    .alert-item.warning {
      background: #fffbeb;
      border-color: #fcd34d;
      color: #92400e;
    }

    .alert-item.danger {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }

    .alert-item.info {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #1d4ed8;
    }

    .alert-item.success {
      background: #ecfdf5;
      border-color: #86efac;
      color: #065f46;
    }

    .alert-icon {
      font-size: 1.1rem;
      line-height: 1.2;
    }

    .alert-text strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }

    .alert-text p {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .alert-count {
      font-weight: 700;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    [data-theme="dark"] .alert-item.warning {
      background: rgba(245, 158, 11, 0.14);
      border-color: rgba(245, 158, 11, 0.4);
      color: #fcd34d;
    }

    [data-theme="dark"] .alert-item.danger {
      background: rgba(239, 68, 68, 0.14);
      border-color: rgba(248, 113, 113, 0.45);
      color: #fca5a5;
    }

    [data-theme="dark"] .alert-item.info {
      background: rgba(59, 130, 246, 0.14);
      border-color: rgba(96, 165, 250, 0.45);
      color: #93c5fd;
    }

    [data-theme="dark"] .alert-item.success {
      background: rgba(34, 197, 94, 0.14);
      border-color: rgba(74, 222, 128, 0.45);
      color: #86efac;
    }

    [data-theme="dark"] .alert-text p,
    [data-theme="dark"] .alert-count {
      color: inherit;
      opacity: 0.92;
    }

    @media (max-width: 1400px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AdminHomeComponent implements OnInit {
  stats: AdminDashboardStats = {
    kpis: { activeUsers: 0, activeProjects: 0, inReview: 0, storageUsed: 0 },
    projectStats: { draft: 0, inProgress: 0, inReview: 0, completed: 0 },
    alerts: [],
  };
  activeUsersCount = 0;
  activeCoursesCount = 0;

  loading = true;
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private projectService: ProjectService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      dashboard: this.adminService.getDashboardStats(),
      users: this.adminService.getUsers().pipe(catchError(() => of([]))),
      projects: this.projectService.getAllProjects().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ dashboard, users, projects }) => {
        const safeUsers = Array.isArray(users) ? users : [];
        const safeProjects = Array.isArray(projects) ? projects : [];

        const derivedActiveUsers = safeUsers.length
          ? safeUsers.filter((u) => (u as { isActive?: boolean })?.isActive !== false).length
          : Number(dashboard?.kpis?.activeUsers || 0);

        const derivedActiveCourses = safeProjects.length
          ? this.countActiveCourses(safeProjects)
          : this.getActiveCoursesFromStats(dashboard);

        this.activeUsersCount = this.safeNonNegative(derivedActiveUsers);
        this.activeCoursesCount = this.safeNonNegative(derivedActiveCourses);

        this.stats = {
          ...dashboard,
          kpis: {
            ...dashboard.kpis,
            activeUsers: this.activeUsersCount,
            activeProjects: this.activeCoursesCount,
          },
          alerts: [...(dashboard.alerts || [])].sort((a, b) => a.priority - b.priority),
        };
        this.loading = false;
      },
      error: (err: unknown) => {
        if (this.shouldSuppressReadError(err)) {
          this.stats = {
            kpis: { activeUsers: 0, activeProjects: 0, inReview: 0, storageUsed: 0 },
            projectStats: { draft: 0, inProgress: 0, inReview: 0, completed: 0 },
            alerts: [],
          };
          this.activeUsersCount = 0;
          this.activeCoursesCount = 0;
          this.errorMessage = '';
          this.loading = false;
          return;
        }

        this.errorMessage = this.toDashboardErrorMessage(err);
        this.loading = false;
      },
    });
  }

  private safeNonNegative(value: unknown): number {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.round(num);
  }

  private getActiveCoursesFromStats(data: AdminDashboardStats): number {
    const fromKpi = this.safeNonNegative(data?.kpis?.activeProjects);
    if (fromKpi > 0) return fromKpi;

    const p = data?.projectStats;
    return this.safeNonNegative(
      Number(p?.draft || 0) +
      Number(p?.inProgress || 0) +
      Number(p?.inReview || 0) +
      Number(p?.completed || 0),
    );
  }

  private countActiveCourses(projects: ProjectDto[]): number {
    return projects.filter((project) => {
      const status = String(project?.status || '').trim().toLowerCase();
      return status !== 'archived' && status !== 'archivado' && status !== 'closed';
    }).length;
  }

  private shouldSuppressReadError(err: unknown): boolean {
    const status = (err as { status?: unknown })?.status;
    if (typeof status !== 'number') return false;
    if (status === 401 || status === 403) return false;
    return status === 400 || status >= 500;
  }

  private toDashboardErrorMessage(err: unknown): string {
    const rawMessage = (err as { message?: unknown })?.message;
    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      const lower = rawMessage.toLowerCase();
      if (lower.includes('http failure response for')) {
        return 'No se pudieron cargar las métricas del dashboard.';
      }
      return rawMessage;
    }
    return 'No se pudieron cargar las métricas del dashboard.';
  }

  getAlertIcon(type: AdminDashboardAlert['type']): string {
    if (type === 'danger') return '⛔';
    if (type === 'warning') return '⚠️';
    if (type === 'success') return '✅';
    return 'ℹ️';
  }
}
