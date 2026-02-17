import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GodProjectsComponent } from './components/god-projects/god-projects';
import { GodAuditComponent } from './components/god-audit/god-audit';

type Tab = 'projects' | 'audit';

@Component({
  selector: 'app-god-mode',
  standalone: true,
  imports: [
    CommonModule,
    GodProjectsComponent,
    GodAuditComponent,
  ],
  template: `
    <div class="god-mode-page">
      <div class="page-header">
        <h1>🎯 Modo God</h1>
        <p>Vista de supervisión global. Observabilidad total, intervención cero.</p>
      </div>

      <div class="god-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'projects'" (click)="activeTab = 'projects'">
          📊 Proyectos Globales
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'">
          🧾 Auditoría
        </button>
      </div>

      <div class="god-content">
        <div *ngIf="activeTab === 'projects'">
          <app-god-projects></app-god-projects>
        </div>
        <div *ngIf="activeTab === 'audit'">
          <app-god-audit></app-god-audit>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .god-mode-page { max-width: 1400px; margin: 0 auto; padding-bottom: 2rem; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.25rem; }
    .page-header p { color: var(--slate-500); font-size: 0.95rem; }

    .god-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--slate-200);
      padding-bottom: 1px;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--slate-500);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: var(--primary-600);
      background: var(--slate-50);
    }

    .tab-btn.active {
      color: var(--primary-600);
      border-bottom-color: var(--primary-600);
    }

    .god-content {
      background: var(--card-bg, white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--slate-200);
      min-height: 400px;
    }

    .radar-container {
      padding: 1.5rem;
    }
  `]
})
export class GodModeComponent {
  activeTab: Tab = 'projects';
}
