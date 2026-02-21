import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepositoryHeaderDto, RepositoryStatsDto } from '../../core/models/project.models';
import { SessionService } from '../../core/auth/data-access/session.service';

@Component({
  selector: 'app-repository-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="repository-header">
      <div class="header-top">
        <div class="header-left">
          <div class="icon-wrapper">
            <svg class="icon-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="title-wrapper">
            <h1 class="repo-title">{{ header?.title }}</h1>
            <span class="visibility-badge" *ngIf="header?.status">
              {{ header?.status }}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <ng-container *ngIf="!hideWatchFork">
            <button class="btn btn-secondary" (click)="onWatch()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Watch
            </button>
          </ng-container>
        </div>
      </div>

      <p class="header-description" *ngIf="header?.description">
        {{ header?.description }}
      </p>

      <div class="header-meta">
        <div class="meta-item" *ngIf="header?.owner">
          <div class="avatar-small">{{ (header?.owner || 'A').charAt(0).toUpperCase() }}</div>
          <span class="owner-name">{{ header?.owner }}</span>
        </div>
        
        <div class="divider"></div>

        <div class="meta-item" *ngIf="stats">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="stat-label">{{ stats.lastUpdate }}</span>
        </div>
      </div>

      <div class="tags" *ngIf="header?.tags?.length">
        <span class="tag" *ngFor="let tag of header?.tags">{{ tag }}</span>
      </div>
    </div>
  `,
  styles: [`
    .repository-header {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
      border: 1px solid rgba(102, 126, 234, 0.1);
      border-radius: 20px;
      padding: 1.75rem;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
    }

    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      gap: 1rem;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .icon-folder {
      width: 24px;
      height: 24px;
    }

    .title-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .repo-title {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      line-height: 1.2;
    }

    .visibility-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 20px;
      color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      width: fit-content;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .header-actions {
      display: flex;
      gap: 0.625rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-secondary {
      background: white;
      border: 1px solid rgba(102, 126, 234, 0.2);
      color: #64748b;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-color: #667eea;
      color: #667eea;
      transform: translateY(-2px);
    }

    .header-description {
      margin: 1.25rem 0 1.5rem;
      font-size: 0.95rem;
      color: #64748b;
      line-height: 1.6;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(102, 126, 234, 0.1);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .avatar-small {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.25);
    }

    .owner-name {
      font-weight: 600;
      color: #1e293b;
    }

    .icon {
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }

    .stat-value {
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      color: #94a3b8;
    }

    .divider {
      width: 1px;
      height: 20px;
      background: linear-gradient(180deg, transparent, rgba(102, 126, 234, 0.3), transparent);
    }

    .tags {
      margin-top: 1.25rem;
      display: flex;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    .tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      color: #667eea;
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 20px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .tag:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
    }
  `]
})
export class RepositoryHeaderComponent {
  private readonly SessionService = inject(SessionService);

  get hideWatchFork(): boolean {
    const role = (this.SessionService.getRole() ?? '').toLowerCase();
    return role === 'docente' || role === 'colaborador';
  }

  @Input() header: RepositoryHeaderDto | null = null;
  @Input() stats: RepositoryStatsDto | null = null;
  @Output() watch = new EventEmitter<void>();

  onWatch() {
    console.log('Watch clicked');
    alert('✅ Ahora estás observando este proyecto. Recibirás notificaciones de cambios.');
    this.watch.emit();
  }
}




