import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SessionService } from '../../core/auth/data-access/session.service';
import { AdminHomeComponent } from './components/admin-home/admin-home';
import { AdminUsersComponent } from './components/admin-users/admin-users';
import { AdminProjectsComponent } from './components/admin-projects/admin-projects';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings';

type AdminTab = 'dashboard' | 'users' | 'projects' | 'settings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminHomeComponent,
    AdminUsersComponent,
    AdminProjectsComponent,
    AdminSettingsComponent,
  ],
  template: `
    <div class="admin-page">
      <div class="content-header">
        <h1>{{ getTitle() }}</h1>
        <span class="user-badge">{{ currentUser?.name }} (Admin)</span>
      </div>

      <nav class="admin-tabs">
        <button class="tab" [class.active]="activeTab === 'dashboard'" (click)="setActiveTab('dashboard')">
          Dashboard
        </button>
        <button class="tab" [class.active]="activeTab === 'users'" (click)="setActiveTab('users')">
          Usuarios
        </button>
        <button class="tab" [class.active]="activeTab === 'projects'" (click)="setActiveTab('projects')">
          Proyectos
        </button>
        <button class="tab" [class.active]="activeTab === 'settings'" (click)="setActiveTab('settings')">
          Configuracion
        </button>
      </nav>

      <div class="content-body">
        <app-admin-home *ngIf="activeTab === 'dashboard'"></app-admin-home>
        <app-admin-users *ngIf="activeTab === 'users'"></app-admin-users>
        <app-admin-projects *ngIf="activeTab === 'projects'"></app-admin-projects>
        <app-admin-settings *ngIf="activeTab === 'settings'"></app-admin-settings>
      </div>
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

    .admin-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      padding: 0.85rem;
      border-radius: 12px;
      background: var(--card-bg, #fff);
      border: 1px solid var(--slate-200);
    }

    .tab {
      background: transparent;
      border: 1px solid transparent;
      padding: 0.65rem 0.95rem;
      border-radius: 10px;
      color: var(--slate-600);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .tab:hover {
      background: var(--slate-100);
      color: var(--slate-800);
      border-color: var(--slate-200);
    }

    .tab.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary-700);
      border-color: rgba(99, 102, 241, 0.25);
      font-weight: 700;
    }

    .content-body {
      min-width: 0;
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
export class AdminComponent {
  activeTab: AdminTab = 'dashboard';
  currentUser: any;

  private readonly allowedTabs: ReadonlyArray<AdminTab> = [
    'dashboard',
    'users',
    'projects',
    'settings',
  ];

  constructor(
    private SessionService: SessionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentUser = this.SessionService.getUserFromToken();

    this.route.queryParamMap.subscribe((params) => {
      const tabParam = (params.get('tab') || '').toLowerCase() as AdminTab;
      this.activeTab = this.allowedTabs.includes(tabParam) ? tabParam : 'dashboard';
    });
  }

  getTitle(): string {
    const titles: Record<AdminTab, string> = {
      dashboard: 'Dashboard General',
      users: 'Gestion de Usuarios',
      projects: 'Control de Proyectos',
      settings: 'Configuracion del Sistema',
    };

    return titles[this.activeTab];
  }

  setActiveTab(tab: AdminTab): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  logout(): void {
    this.SessionService.logout();
    window.location.href = '/login';
  }
}
