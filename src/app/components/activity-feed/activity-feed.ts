import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity, TimelineFilters } from '../../core/data-access/activity.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-feed">
      <div class="feed-header">
        <h3>📰 Feed de Actividad</h3>
        <div class="feed-subtitle">Actividad reciente de tu equipo y proyectos</div>
      </div>

      <!-- Filtros -->
      <div class="feed-filters">
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'all'"
            (click)="setFilter('all')">
            Todas
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'project'"
            (click)="setFilter('project')">
            📁 Proyectos
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'evidence'"
            (click)="setFilter('evidence')">
            📄 Evidencias
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'file'"
            (click)="setFilter('file')">
            📎 Archivos
          </button>
        </div>
        
        <div class="feed-stats" *ngIf="activities.length > 0">
          <span class="stat-item">📊 {{ activities.length }} actividades</span>
          <span class="stat-item">👥 {{ getUniqueUsers() }} usuarios</span>
          <span class="stat-item">🕒 {{ getLatestTime() }}</span>
        </div>
      </div>

      <!-- Estado de carga -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando actividad...</p>
      </div>

      <!-- Mensaje de error -->
      <div *ngIf="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Lista de actividades -->
      <div *ngIf="!loading && activities.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No hay actividad reciente.</p>
        <p class="empty-subtitle">Cuando haya actividad en tus proyectos, aparecerá aquí.</p>
      </div>

      <div class="activity-list" *ngIf="!loading && activities.length > 0">
        <div *ngFor="let activity of activities" class="activity-item">
          <!-- Icono de acción -->
          <div class="activity-icon" [title]="activity.action">
            {{ getActionIcon(activity.action) }}
          </div>

          <div class="activity-content">
            <!-- Encabezado con usuario y tiempo -->
            <div class="activity-header">
              <div class="user-info">
                <div class="user-avatar">{{ getUserInitial(activity.user.name) }}</div>
                <span class="username">{{ activity.user.name }}</span>
                <span class="action-text">{{ getActionText(activity.action) }}</span>
              </div>
              <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
            </div>

            <!-- Descripción y metadata -->
            <div class="activity-description">
              <p>{{ getActivityDescription(activity) }}</p>
              
              <!-- Metadata específica -->
              <div class="activity-metadata" *ngIf="hasMetadata(activity)">
                <ng-container *ngIf="activity.metadata?.projectName">
                  <span class="metadata-item">📂 {{ activity.metadata.projectName }}</span>
                </ng-container>
                <ng-container *ngIf="activity.metadata?.evidenceTitle">
                  <span class="metadata-item">📄 {{ activity.metadata.evidenceTitle }}</span>
                </ng-container>
                <ng-container *ngIf="activity.metadata?.fileName">
                  <span class="metadata-item">📎 {{ activity.metadata.fileName }}</span>
                </ng-container>
                <ng-container *ngIf="activity.metadata?.status">
                  <span class="metadata-item">🔄 {{ activity.metadata.status }}</span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cargar más -->
      <div class="load-more" *ngIf="!loading && activities.length > 0 && hasMoreActivities">
        <button class="btn-load-more" (click)="loadMore()">
          Cargar más actividades
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activity-feed {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      height: 100%;
    }

    .feed-header {
      margin-bottom: 1.5rem;
    }

    .feed-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0 0 0.25rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .feed-subtitle {
      color: var(--slate-500);
      font-size: 0.9rem;
    }

    .feed-filters {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--slate-200);
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      color: var(--slate-700);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: var(--slate-200);
    }

    .filter-btn.active {
      background: var(--primary-600);
      color: white;
      border-color: var(--primary-600);
    }

    .feed-stats {
      display: flex;
      gap: 1.5rem;
      font-size: 0.8rem;
      color: var(--slate-500);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--slate-500);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--slate-500);
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-subtitle {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      color: var(--slate-400);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--slate-50);
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      transition: all 0.2s;
    }

    .activity-item:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: var(--slate-300);
    }

    .activity-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .activity-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-600);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .username {
      font-weight: 600;
      color: var(--slate-900);
      font-size: 0.95rem;
    }

    .action-text {
      color: var(--slate-600);
      font-size: 0.9rem;
    }

    .activity-time {
      color: var(--slate-400);
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .activity-description {
      margin-bottom: 1rem;
    }

    .activity-description p {
      margin: 0 0 0.75rem 0;
      color: var(--slate-700);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .activity-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    .metadata-item {
      background: white;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .load-more {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--slate-200);
    }

    .btn-load-more {
      padding: 0.75rem 1.5rem;
      background: var(--primary-600);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-load-more:hover {
      background: var(--primary-700);
      transform: translateY(-2px);
    }
  `]
})
export class ActivityFeedComponent implements OnInit {
  activities: Activity[] = [];
  loading = false;
  errorMessage = '';
  activeFilter: 'all' | 'project' | 'evidence' | 'file' = 'all';
  limit = 15;
  offset = 0;
  totalActivities = 0;
  hasMoreActivities = true;

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    this.loading = true;
    this.errorMessage = '';
    
    const filters: TimelineFilters = {
      limit: this.limit,
      offset: this.offset
    };

    // Aplicar filtros por tipo de acción
    if (this.activeFilter !== 'all') {
      filters.action = this.getActionsForFilter(this.activeFilter);
    }

    this.activityService.getTimeline(filters).subscribe({
      next: (response) => {
        if (this.offset === 0) {
          this.activities = response.data;
        } else {
          this.activities = [...this.activities, ...response.data];
        }
        this.totalActivities = response.total;
        this.hasMoreActivities = this.activities.length < response.total;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar la actividad reciente';
        this.loading = false;
        console.error('Activity load error:', err);
      }
    });
  }

  getActionsForFilter(filter: string): string[] {
    switch (filter) {
      case 'project':
        return ['PROJECT_CREATE', 'PROJECT_STATUS_CHANGE', 'PROJECT_UPDATE', 'PROJECT_DELETE', 'PROJECT_ARCHIVE'];
      case 'evidence':
        return ['SUBMIT_EVIDENCE', 'REVIEW_EVIDENCE', 'REVIEW_REQUEST', 'REVIEW_RESOLVE'];
      case 'file':
        return ['FILE_UPLOAD', 'FILE_VERSION_NEW', 'FILE_RESTORE', 'FILE_DELETE'];
      default:
        return [];
    }
  }

  setFilter(filter: 'all' | 'project' | 'evidence' | 'file') {
    this.activeFilter = filter;
    this.activities = [];
    this.offset = 0;
    this.loadActivities();
  }

  loadMore() {
    this.offset += this.limit;
    this.loadActivities();
  }

  getActionText(action: string): string {
    return this.activityService.getActionText(action);
  }

  getActionIcon(action: string): string {
    return this.activityService.getActionIcon(action);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getActivityDescription(activity: Activity): string {
    const action = activity.action;
    const metadata = activity.metadata || {};
    
    switch (action) {
      case 'PROJECT_CREATE':
        return `Creó el proyecto "${metadata.projectName || 'Nuevo proyecto'}"`;
      case 'PROJECT_STATUS_CHANGE':
        return `Cambió el estado del proyecto de "${metadata.previousStatus || 'desconocido'}" a "${metadata.newStatus || 'desconocido'}"`;
      case 'SUBMIT_EVIDENCE':
        return `Envió evidencia "${metadata.evidenceTitle || 'sin título'}" para revisión`;
      case 'REVIEW_EVIDENCE':
        return `Revisó evidencia "${metadata.evidenceTitle || 'sin título'}" con resultado: ${metadata.status || 'sin resultado'}`;
      case 'FILE_UPLOAD':
        return `Subió el archivo "${metadata.fileName || 'sin nombre'}"`;
      case 'FILE_DELETE':
        return `Eliminó el archivo "${metadata.fileName || 'sin nombre'}"`;
      case 'MESSAGE_SENT':
        return `Envió un mensaje en el chat`;
      case 'COMMENT_ADD':
        return `Agregó un comentario`;
      default:
        return `Realizó la acción: ${action}`;
    }
  }

  getUserInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  hasMetadata(activity: Activity): boolean {
    return !!activity.metadata && Object.keys(activity.metadata).length > 0;
  }

  getUniqueUsers(): number {
    const userIds = new Set(this.activities.map(a => a.user.id));
    return userIds.size;
  }

  getLatestTime(): string {
    if (this.activities.length === 0) return 'Nunca';
    const latest = this.activities.reduce((latest, current) => 
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
    );
    return this.formatTime(latest.createdAt);
  }
}
