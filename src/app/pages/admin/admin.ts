import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="brand">Admin Panel</div>
        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
            Dashboard
          </button>
          <button class="nav-item" [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">
            Usuarios
          </button>
          <button class="nav-item" [class.active]="activeTab === 'projects'" (click)="activeTab = 'projects'">
            Proyectos
          </button>
          <button class="nav-item" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">
            Configuración
          </button>
        </nav>

        <div class="user-footer">
          <button class="btn-logout" (click)="logout()">Cerrar sesión</button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="content-header">
          <h1>{{ getTitle() }}</h1>
          <span class="user-badge">{{ currentUser?.name }} (Admin)</span>
        </div>

        <div class="content-body">
          <app-admin-home *ngIf="activeTab === 'dashboard'"></app-admin-home>
          <app-admin-users *ngIf="activeTab === 'users'"></app-admin-users>
          <app-admin-projects *ngIf="activeTab === 'projects'"></app-admin-projects>
          <app-admin-settings *ngIf="activeTab === 'settings'"></app-admin-settings>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: calc(100vh - 90px);
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 14px;
      overflow: hidden;
    }

    .admin-sidebar {
      width: 260px;
      background: var(--card-bg, #fff);
      border-right: 1px solid var(--slate-200);
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
    }

    .brand {
      font-size: 1.9rem;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 2rem;
      padding-left: 0.3rem;
      letter-spacing: -0.01em;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      flex: 1;
    }

    .nav-item {
      text-align: left;
      background: transparent;
      border: 1px solid transparent;
      padding: 0.78rem 1rem;
      border-radius: 10px;
      color: var(--slate-600);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .nav-item:hover {
      background: var(--slate-100);
      color: var(--slate-800);
      border-color: var(--slate-200);
    }

    .nav-item.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary-700);
      border-color: rgba(99, 102, 241, 0.2);
      font-weight: 700;
    }

    .btn-logout {
      margin-top: auto;
      width: 100%;
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      padding: 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.18s ease;
    }

    .btn-logout:hover {
      background: #fee2e2;
    }

    .admin-main {
      flex: 1;
      padding: 2rem;
      overflow: auto;
      background: var(--slate-50);
      min-width: 0;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .content-body {
      min-width: 0;
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

    @media (max-width: 1200px) {
      .admin-layout {
        min-height: auto;
      }

      .admin-sidebar {
        width: 230px;
      }

      .content-header h1 {
        font-size: 2.2rem;
      }
    }

    @media (max-width: 960px) {
      .admin-layout {
        flex-direction: column;
      }

      .admin-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--slate-200);
      }

      .content-header {
        flex-direction: column;
        align-items: flex-start;
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

  constructor(private SessionService: SessionService) {
    this.currentUser = this.SessionService.getUserFromToken();
  }

  getTitle(): string {
    const titles = {
      dashboard: 'Dashboard General',
      users: 'Gestión de Usuarios',
      projects: 'Control de Proyectos',
      settings: 'Configuración del Sistema',
    };
    return titles[this.activeTab];
  }

  logout() {
    this.SessionService.logout();
    window.location.href = '/login';
  }
}


