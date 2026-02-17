import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../../core/data-access/activity.service';

@Component({
    selector: 'app-god-audit',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="god-audit-container">
      <div class="audit-feed">
        <div class="audit-item" *ngFor="let log of logs">
          <div class="audit-time">
            {{ log.createdAt | date:'HH:mm' }}
            <span class="date">{{ log.createdAt | date:'dd MMM' }}</span>
          </div>
          <div class="audit-content">
            <div class="audit-header">
              <span class="user-name">{{ log.user?.name || 'Unknown' }}</span>
              <span class="action-type">{{ formatAction(log.action) }}</span>
            </div>
            <div class="audit-details">
              Proyecto: <strong>{{ log.metadata?.title || 'N/A' }}</strong>
            </div>
             <div class="metadata-raw">
               {{ log.metadata | json }}
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .god-audit-container { padding: 1rem; }
    .audit-feed { display: flex; flex-direction: column; gap: 1rem; }
    .audit-item {
      display: flex;
      gap: 1.5rem;
      padding: 1rem;
      background: var(--slate-50);
      border-radius: var(--border-radius-md);
      border-left: 3px solid var(--primary-500);
    }
    .audit-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      font-weight: 600;
      color: var(--slate-900);
    }
    .audit-time .date {
      font-size: 0.75rem;
      color: var(--slate-500);
      font-weight: 400;
    }
    .audit-content { flex: 1; }
    .audit-header { margin-bottom: 0.25rem; }
    .user-name { font-weight: 700; color: var(--primary-700); margin-right: 0.5rem; }
    .action-type {
      background: var(--slate-200);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--slate-700);
    }
    .audit-details { color: var(--slate-700); font-size: 0.9rem; }
    .metadata-raw {
      margin-top: 0.5rem;
      font-family: monospace;
      font-size: 0.7rem;
      color: var(--slate-400);
      white-space: pre-wrap;
    }
  `]
})
export class GodAuditComponent implements OnInit {
    logs: any[] = [];

    constructor(private activityService: ActivityService) { }

    ngOnInit() {
        this.activityService.getGlobalFeed().subscribe(data => {
            this.logs = data;
        });
    }

    formatAction(action: string): string {
        return action.replace('PROJECT_', '').replace('EVIDENCE_', '').replace('_', ' ');
    }
}
