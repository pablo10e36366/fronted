import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminDashboardAlert,
  AdminDashboardStats,
  AdminService,
} from '../../../../core/data-access/admin.service';

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
          <div class="value">{{ stats.kpis.activeUsers }}</div>
          <div class="label">Usuarios Activos</div>
        </div>
        <div class="kpi-card projects">
          <div class="icon">🚀</div>
          <div class="value">{{ stats.kpis.activeProjects }}</div>
          <div class="label">Proyectos Activos</div>
        </div>
        <div class="kpi-card review">
          <div class="icon">👀</div>
          <div class="value">{{ stats.kpis.inReview }}</div>
          <div class="label">En Revisión</div>
        </div>
        <div class="kpi-card storage">
          <div class="icon">💾</div>
          <div class="value">{{ stats.kpis.storageUsed }}%</div>
          <div class="label">Espacio Usado</div>
        </div>
      </div>

      <div class="dashboard-content-grid" *ngIf="!loading">
        <div class="chart-section">
          <h3>Estado de Proyectos</h3>
          <div class="simple-bar-chart">
            <div class="bar-item">
              <span class="label">Borrador</span>
              <div class="bar-bg">
                <div class="bar-fill" [style.width.%]="getBarWidth(stats.projectStats.draft)"></div>
              </div>
              <span class="count">{{ stats.projectStats.draft }}</span>
            </div>
            <div class="bar-item">
              <span class="label">En Progreso</span>
              <div class="bar-bg">
                <div class="bar-fill in-progress" [style.width.%]="getBarWidth(stats.projectStats.inProgress)"></div>
              </div>
              <span class="count">{{ stats.projectStats.inProgress }}</span>
            </div>
            <div class="bar-item">
              <span class="label">En Revisión</span>
              <div class="bar-bg">
                <div class="bar-fill in-review" [style.width.%]="getBarWidth(stats.projectStats.inReview || 0)"></div>
              </div>
              <span class="count">{{ stats.projectStats.inReview || 0 }}</span>
            </div>
            <div class="bar-item">
              <span class="label">Completado</span>
              <div class="bar-bg">
                <div class="bar-fill completed" [style.width.%]="getBarWidth(stats.projectStats.completed)"></div>
              </div>
              <span class="count">{{ stats.projectStats.completed }}</span>
            </div>
          </div>
        </div>

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
      grid-template-columns: repeat(4, minmax(0, 1fr));
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

    .dashboard-content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    .chart-section,
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

    .simple-bar-chart {
      display: flex;
      flex-direction: column;
      gap: 1.05rem;
    }

    .bar-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-item .label {
      width: 115px;
      font-size: 0.95rem;
      color: var(--slate-700);
      font-weight: 600;
    }

    .bar-bg {
      flex: 1;
      height: 11px;
      background: var(--slate-200);
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #64748b;
      border-radius: 999px;
    }

    .bar-fill.in-progress {
      background: var(--primary-500);
    }

    .bar-fill.in-review {
      background: #f59e0b;
    }

    .bar-fill.completed {
      background: #22c55e;
    }

    .count {
      min-width: 20px;
      text-align: right;
      font-weight: 700;
      color: var(--slate-800);
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

    @media (max-width: 1400px) {
      .kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dashboard-content-grid {
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

  loading = true;
  errorMessage = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getDashboardStats().subscribe({
      next: (data: AdminDashboardStats) => {
        this.stats = {
          ...data,
          alerts: [...(data.alerts || [])].sort((a, b) => a.priority - b.priority),
        };
        this.loading = false;
      },
      error: (err: unknown) => {
        this.errorMessage =
          (err as { message?: string })?.message || 'No se pudieron cargar las métricas del dashboard.';
        this.loading = false;
      },
    });
  }

  getBarWidth(count: number): number {
    const totals = this.stats.projectStats;
    const total = (totals.draft || 0) + (totals.inProgress || 0) + (totals.inReview || 0) + (totals.completed || 0);
    return total > 0 ? (count / total) * 100 : 0;
  }

  getAlertIcon(type: AdminDashboardAlert['type']): string {
    if (type === 'danger') return '⛔';
    if (type === 'warning') return '⚠️';
    if (type === 'success') return '✅';
    return 'ℹ️';
  }
}
