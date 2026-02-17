import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GodAlertsService, SystemAlert } from '../../../../core/data-access/god-alerts.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-god-alerts',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="god-alerts-container">
      <div class="alerts-header">
        <h2>🔔 Alertas Pasivas del Sistema</h2>
        <p class="subtitle">Monitoreo automático de anomalías y métricas del sistema</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando alertas del sistema...</p>
      </div>

      <!-- No Alerts State -->
      <div *ngIf="!loading && alerts.length === 0" class="no-alerts">
        <div class="no-alerts-icon">✅</div>
        <h3>Sistema Saludable</h3>
        <p>No se detectaron alertas pasivas en este momento.</p>
      </div>

      <!-- Alerts Grid -->
      <div *ngIf="!loading && alerts.length > 0" class="alert-grid">
        <div *ngFor="let alert of alerts"
             class="alert-card"
             [class.danger]="alert.type === 'danger'"
             [class.warning]="alert.type === 'warning'"
             [class.info]="alert.type === 'info'"
             [class.success]="alert.type === 'success'">
          <div class="alert-icon">{{ getAlertIcon(alert.type) }}</div>
          <div class="alert-info">
            <div class="alert-header">
              <h3>{{ alert.title }}</h3>
              <span class="alert-priority" [class]="'priority-' + alert.priority">
                Prioridad {{ alert.priority }}
              </span>
            </div>
            <p class="count">{{ alert.count }}</p>
            <span class="detail">{{ alert.description }}</span>
            <div *ngIf="alert.details && alert.details.length > 0" class="alert-details">
              <ul>
                <li *ngFor="let detail of alert.details">{{ detail }}</li>
              </ul>
            </div>
            <div class="alert-actions">
              <button class="btn-mark-read" (click)="markAsRead(alert.id)">
                Marcar como leído
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Stats Summary -->
      <div *ngIf="!loading" class="stats-summary">
        <h3>📊 Resumen del Sistema</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Alertas Activas</span>
            <span class="stat-value">{{ alerts.length }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Prioridad Alta</span>
            <span class="stat-value">{{ getHighPriorityCount() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Última Actualización</span>
            <span class="stat-value">{{ lastUpdate | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .god-alerts-container { padding: 1rem; }
    
    .alerts-header {
      margin-bottom: 2rem;
    }
    
    .alerts-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      color: var(--slate-500);
      font-size: 0.9rem;
    }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--slate-500);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-alerts {
      text-align: center;
      padding: 3rem;
      background: var(--success-bg);
      border-radius: var(--border-radius-lg);
      margin-bottom: 2rem;
    }
    
    .no-alerts-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .no-alerts h3 {
      color: var(--success-color);
      margin-bottom: 0.5rem;
    }
    
    .alert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .alert-card {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      border-left: 5px solid;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .alert-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .alert-card.danger { border-color: var(--danger-color); background: #fef2f2; }
    .alert-card.warning { border-color: var(--warning-color); background: #fffbeb; }
    .alert-card.info { border-color: var(--info-color); background: #eff6ff; }
    .alert-card.success { border-color: var(--success-color); background: #f0fdf4; }

    .alert-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .alert-info {
      flex: 1;
    }
    
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    
    .alert-info h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--slate-800);
      margin: 0;
      flex: 1;
    }
    
    .alert-priority {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .priority-1, .priority-2 { background: var(--danger-color); color: white; }
    .priority-3 { background: var(--warning-color); color: var(--slate-900); }
    .priority-4, .priority-5 { background: var(--slate-200); color: var(--slate-700); }
    
    .count {
      font-size: 2rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0.5rem 0;
    }
    
    .detail {
      font-size: 0.85rem;
      color: var(--slate-600);
      display: block;
      margin-bottom: 1rem;
    }
    
    .alert-details {
      background: rgba(255, 255, 255, 0.7);
      border-radius: var(--border-radius);
      padding: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .alert-details ul {
      margin: 0;
      padding-left: 1rem;
    }
    
    .alert-details li {
      font-size: 0.8rem;
      color: var(--slate-600);
      margin-bottom: 0.25rem;
    }
    
    .alert-actions {
      display: flex;
      justify-content: flex-end;
    }
    
    .btn-mark-read {
      background: transparent;
      border: 1px solid var(--slate-300);
      color: var(--slate-600);
      padding: 0.4rem 0.8rem;
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-mark-read:hover {
      background: var(--slate-100);
      border-color: var(--slate-400);
    }
    
    .stats-summary {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    
    .stats-summary h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: var(--slate-800);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .stat-card {
      background: var(--slate-50);
      border-radius: var(--border-radius);
      padding: 1rem;
      text-align: center;
    }
    
    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: var(--slate-500);
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--slate-900);
    }
  `]
})
export class GodAlertsComponent implements OnInit, OnDestroy {
    alerts: SystemAlert[] = [];
    loading = true;
    lastUpdate = new Date();
    private subscription?: Subscription;

    constructor(private godAlertsService: GodAlertsService) { }

    ngOnInit() {
        this.loadAlerts();
        
        // Actualizar alertas cada 30 segundos
        this.subscription = this.godAlertsService.getPassiveAlerts().subscribe({
            next: (alerts) => {
                this.alerts = alerts;
                this.loading = false;
                this.lastUpdate = new Date();
            },
            error: (error) => {
                console.error('Error loading alerts:', error);
                this.loading = false;
                // Mostrar datos de ejemplo en caso de error
                this.alerts = this.getMockAlerts();
            }
        });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    loadAlerts() {
        this.loading = true;
    }

    getAlertIcon(type: string): string {
        const icons: Record<string, string> = {
            'danger': '⚠️',
            'warning': '⏳',
            'info': '📊',
            'success': '✅'
        };
        return icons[type] || '📌';
    }

    markAsRead(alertId: string) {
        this.godAlertsService.markAlertAsRead(alertId).subscribe(() => {
            // Remover la alerta de la lista localmente
            this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        });
    }

    getHighPriorityCount(): number {
        return this.alerts.filter(alert => alert.priority <= 2).length;
    }

    getMockAlerts(): SystemAlert[] {
        return [
            {
                id: 'inactive-projects',
                type: 'danger',
                title: 'Proyectos Inactivos (>30 días)',
                description: '3 proyectos no han tenido actividad reciente',
                count: 3,
                details: ['Project Alpha', 'Beta Test', 'Gamma Release'],
                priority: 2
            },
            {
                id: 'stuck-reviews',
                type: 'warning',
                title: 'Revisiones Estancadas',
                description: '1 revisión lleva más de 5 días sin resolver',
                count: 1,
                details: ['Proyecto "Landing Page"'],
                priority: 3
            },
            {
                id: 'system-activity',
                type: 'info',
                title: 'Ritmo del Sistema',
                description: '42 actividades esta semana',
                count: 42,
                priority: 4
            }
        ];
    }
}
