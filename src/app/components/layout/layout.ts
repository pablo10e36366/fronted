import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { SearchBarComponent } from '../search-bar/search-bar';
import { FabMenuComponent } from '../fab-menu/fab-menu';
import { ActivityFeedComponent } from '../activity-feed/activity-feed';
import { WarRoomTimerComponent } from '../war-room-timer/war-room-timer';
import { SessionService } from '../../core/auth/data-access/session.service';
import { JwtUserPayload } from '../../core/models/auth.models';
import { ProjectService } from '../../core/data-access/project.service';
import { AdminUiPreferencesService } from '../../core/data-access/admin-ui-preferences.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SearchBarComponent,
    FabMenuComponent,
    ActivityFeedComponent,
    WarRoomTimerComponent
  ],
  template: `
    <div class="app-layout">
      <!-- GLOBAL WAR ROOM TIMER OVERLAY/BANNER -->
      <app-war-room-timer [deadline]="currentDeadline()"></app-war-room-timer>

      <!-- SIDEBAR NAVIGATION -->
      <aside class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">
        <button
          type="button"
          class="sidebar-toggle"
          (click)="toggleSidebarCollapse()"
          [attr.aria-label]="sidebarCollapsed ? 'Expandir menu lateral' : 'Ocultar menu lateral'"
          [title]="sidebarCollapsed ? 'Expandir menu lateral' : 'Ocultar menu lateral'">
          <svg class="sidebar-toggle-icon" [class.sidebar-toggle-icon--expanded]="!sidebarCollapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 6 15 12 9 18"></polyline>
          </svg>
        </button>
        <div class="sidebar-shell">
        <div class="sidebar-header">
          <div class="logo-container">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span class="logo-text">ProManage</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-label">General</span>
            <a routerLink="/projects" routerLinkActive="active" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Projects
            </a>
            <a routerLink="/folders" routerLinkActive="active" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Folders
            </a>
            <a
              routerLink="/feed"
              routerLinkActive="active"
              class="nav-item"
              *ngIf="(user$ | async)?.role !== 'DOCENTE' && !isAdminRole((user$ | async)?.role)">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 11a9 9 0 0 1 9 9"></path>
                <path d="M4 4a16 16 0 0 1 16 16"></path>
                <circle cx="5" cy="19" r="1"></circle>
              </svg>
              Feed
            </a>
          </div>

          <div class="nav-section" *ngIf="isAdminRole((user$ | async)?.role)">
            <span class="nav-label">Admin</span>
            <a
              routerLink="/god-mode"
              routerLinkActive="active"
              class="nav-item nav-item-special"
              *ngIf="adminUiPreferences.isGodModeVisible()">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              Modo God
            </a>
            <a
              routerLink="/admin"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Dashboard
            </a>
            <a
              routerLink="/admin/notifications"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notificaciones
            </a>
            <a
              routerLink="/admin/archived"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              Archivados
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-label">Sistema</span>
            <a routerLink="/settings" routerLinkActive="active" class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Configuración
            </a>
          </div>
        </nav>

        <!-- ACTIVITY WIDGET -->
        <div class="sidebar-widget" *ngIf="!isAdminRole((user$ | async)?.role)">
          <div class="widget-header">
            <span>Recent Activity</span>
          </div>
          <div class="activity-container">
            <app-activity-feed></app-activity-feed>
          </div>
        </div>

        <!-- USER PROFILE FOOTER -->
        <div class="sidebar-footer" *ngIf="user$ | async as user">
          <div class="user-profile">
            <div class="avatar">{{ (user.name || user.email || 'A').charAt(0).toUpperCase() }}</div>
            <div class="user-details">
              <span class="user-name">{{ user.name || 'User' }}</span>
              <span class="user-role">{{ user.role || 'Member' }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="logout-icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
        </div>
      </aside>

      <!-- MAIN CONTENT AREA -->
      <main class="main-area">
        <header class="top-bar" *ngIf="showTopSearchBar">
          <div class="search-container">
            <app-search-bar></app-search-bar>
          </div>
          <!-- Optional: Add notification bell or other top-right actions here -->
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- FLOATING ACTION BUTTON -->
      <app-fab-menu 
        [userRole]="(user$ | async)?.role || ''"
        [godModeVisible]="adminUiPreferences.isGodModeVisible()"
        (onNewProject)="handleNewProject()"
        (onFileUpload)="handleFileUpload($event)"
        (onGodMode)="handleGodMode()">
      </app-fab-menu>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: var(--slate-50);
    }

    /* SIDEBAR - Premium Gradient */
    .sidebar {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, #1a1f2e 0%, #0f172a 50%, #0c1322 100%);
      color: var(--slate-300);
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(102, 126, 234, 0.1);
      flex-shrink: 0;
      transition: width 0.3s ease, transform 0.3s ease;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: visible;
      transform: translateX(0);
    }

    .sidebar-shell {
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .sidebar--collapsed {
      width: 14px;
      min-width: 14px;
      border-right-color: rgba(102, 126, 234, 0.25);
      box-shadow: none;
    }

    .sidebar--collapsed .sidebar-shell {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .sidebar-toggle {
      position: absolute;
      top: 50%;
      right: -15px;
      transform: translateY(-50%);
      width: 30px;
      height: 56px;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 30;
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .sidebar-toggle:hover {
      transform: translateY(-50%) scale(1.05);
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.3);
    }

    .sidebar-toggle:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    .sidebar-toggle-icon {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .sidebar-toggle-icon--expanded {
      transform: rotate(180deg);
    }

    .sidebar-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      border-bottom: 1px solid var(--slate-800);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
      font-weight: 700;
      font-size: 1.125rem;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      padding: 4px;
      color: white;
    }

    .logo-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--slate-500);
      font-weight: 600;
      margin-bottom: 0.5rem;
      padding-left: 0.75rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--border-radius-md);
      color: var(--slate-400);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--slate-100);
    }

    .nav-item.active {
      background-color: var(--primary-600);
      color: white;
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .nav-item:hover .nav-icon {
      opacity: 1;
    }

    .nav-item.active .nav-icon {
      opacity: 1;
    }

    .nav-item-special {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 1px solid rgba(102, 126, 234, 0.3);
    }

    .nav-item-special:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      border-color: rgba(102, 126, 234, 0.5);
    }

    /* WIDGETS */
    .sidebar-widget {
      padding: 0 1rem 1rem;
      border-top: 1px solid var(--slate-800);
    }

    .widget-header {
      padding: 1rem 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: uppercase;
    }

    .activity-container {
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.75rem;
    }

    /* FOOTER */
    .sidebar-footer {
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--slate-800);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--slate-500);
      text-transform: capitalize;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--slate-500);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--border-radius-md);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logout-btn:hover {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--danger-color);
    }

    .logout-icon {
      width: 18px;
      height: 18px;
    }

    /* MAIN AREA */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0; /* Prevent flex overflow */
    }

    .top-bar {
      height: var(--header-height);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(102, 126, 234, 0.1);
      display: flex;
      align-items: center;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    }
    
    :host-context([data-theme="dark"]) .top-bar {
      background: rgba(15, 23, 42, 0.95); /* Slate 900ish with opacity */
      border-bottom-color: var(--slate-200);
    }

    :host-context([data-theme="dark"]) .sidebar-toggle {
      background: #0f172a;
      color: #e2e8f0;
      border-color: rgba(148, 163, 184, 0.45);
      box-shadow: 0 10px 24px rgba(2, 6, 23, 0.55);
    }

    :host-context([data-theme="dark"]) .sidebar-toggle:hover {
      box-shadow: 0 12px 26px rgba(2, 6, 23, 0.65);
    }

    .search-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: var(--slate-50);
    }

    @media (max-width: 900px) {
      .app-layout {
        position: relative;
      }

      .sidebar {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 280px;
        min-width: 280px;
        z-index: 30;
      }

      .sidebar--collapsed {
        width: 280px;
        min-width: 280px;
        transform: translateX(-266px);
      }

      .main-area {
        width: 100%;
      }

      .top-bar {
        padding: 0 1rem;
      }

      .content-wrapper {
        padding: 1rem;
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  user$: Observable<JwtUserPayload | null>;
  currentDeadline = signal<string | undefined>(undefined);
  sidebarCollapsed = false;

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private SessionService: SessionService,
    private projectService: ProjectService,
    public adminUiPreferences: AdminUiPreferencesService
  ) {
    this.user$ = this.SessionService.currentUser$;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1200) {
      this.sidebarCollapsed = true;
    }
    this.loadNearestDeadline();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private loadNearestDeadline(): void {
    const sub = this.projectService.getMyProjects().subscribe({
      next: (projects) => {
        const now = new Date();
        const upcoming = projects
          .filter(p => p.deadline && new Date(p.deadline) > now)
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

        if (upcoming.length > 0 && upcoming[0].deadline) {
          this.currentDeadline.set(upcoming[0].deadline);
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }

  logout(): void {
    this.SessionService.logout();
    this.router.navigate(['/login']);
  }

  handleNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  handleFileUpload(files: File[]): void {
    if (files.length > 0) {
      console.log('Files to upload:', files);
    }
  }

  handleGodMode(): void {
    this.router.navigate(['/god-mode']);
  }

  toggleSidebarCollapse(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  isAdminRole(role: string | null | undefined): boolean {
    return String(role || '').toLowerCase() === 'admin';
  }

  get showTopSearchBar(): boolean {
    const path = (this.router.url || '').split('?')[0];
    return !['/projects', '/admin/notifications', '/admin/archived'].includes(path);
  }
}

