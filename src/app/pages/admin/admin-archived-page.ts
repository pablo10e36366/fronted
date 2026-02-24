import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { SessionService } from '../../core/auth/data-access/session.service';
import { AdminProjectsComponent } from './components/admin-projects/admin-projects';

@Component({
  selector: 'app-admin-archived-page',
  standalone: true,
  imports: [CommonModule, AdminProjectsComponent],
  template: `
    <div class="admin-page">
      <div class="content-header">
        <h1>Cursos Archivados</h1>
        <span class="user-badge">{{ currentUser?.name }} (Admin)</span>
      </div>

      <app-admin-projects
        [mode]="'archived'"
        [title]="'Archivados'">
      </app-admin-projects>
    </div>
  `,
  styles: [`
    .admin-page {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .content-header h1 {
      font-size: 2.6rem;
      font-weight: 800;
      color: var(--slate-900);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .user-badge {
      font-size: 0.95rem;
      color: var(--slate-600);
      background: var(--card-bg, #fff);
      padding: 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid var(--slate-200);
      font-weight: 600;
      white-space: nowrap;
    }

    @media (max-width: 960px) {
      .content-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .content-header h1 {
        font-size: 2.2rem;
      }

      .user-badge {
        align-self: flex-start;
      }
    }
  `],
})
export class AdminArchivedPageComponent {
  currentUser: { name?: string } | null = null;

  constructor(private readonly sessionService: SessionService) {
    this.currentUser = this.sessionService.getUserFromToken() as { name?: string } | null;
  }
}
