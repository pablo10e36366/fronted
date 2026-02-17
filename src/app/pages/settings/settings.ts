import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/data-access/theme.service';
import { AdminService, SystemSettings } from '../../core/data-access/admin.service';
import { SessionService } from '../../core/auth/data-access/session.service';
import { AdminUiPreferencesService } from '../../core/data-access/admin-ui-preferences.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1>Configuración</h1>
        <p>Personaliza tu experiencia en ProManage</p>
      </header>

      <div *ngIf="message" class="alert" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
        {{ message }}
      </div>

      <div class="settings-content">
        <div class="settings-card">
          <div class="card-header">
            <h2>Apariencia</h2>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <h3>Tema Oscuro</h3>
              <p>Cambia entre el modo claro y oscuro.</p>
            </div>
            <div class="setting-action">
              <button
                class="theme-toggle-btn"
                [class.active]="themeService.isDark()"
                (click)="themeService.toggleTheme()"
                [disabled]="!isAdmin"
                [title]="isAdmin ? 'Cambiar tema' : 'Solo disponible para administrador'">
                <div class="toggle-track">
                  <div class="toggle-thumb"></div>
                </div>
              </button>
            </div>
          </div>

          <div class="setting-item" *ngIf="isAdmin">
            <div class="setting-info">
              <h3>Modo God</h3>
              <p>Muestra u oculta el acceso a Modo God en el sidebar.</p>
            </div>
            <div class="setting-action">
              <button
                class="theme-toggle-btn"
                [class.active]="adminUiPreferences.isGodModeVisible()"
                (click)="adminUiPreferences.toggleGodModeVisibility()"
                title="Mostrar/Ocultar Modo God">
                <div class="toggle-track">
                  <div class="toggle-thumb"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="settings-card" *ngIf="isAdmin && settings">
          <div class="card-header">
            <h2>Configuración del Sistema (Admin)</h2>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Límite de Almacenamiento (MB)</h3>
            </div>
            <input type="number" [(ngModel)]="settings.storageLimit" class="input-setting">
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Tipos de Archivo Permitidos</h3>
            </div>
            <input type="text" [(ngModel)]="settings.allowedFileTypes" class="input-setting">
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Días Máximos de Revisión</h3>
            </div>
            <input type="number" [(ngModel)]="settings.maxReviewDays" class="input-setting">
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Habilitar Logs de Auditoría</h3>
            </div>
            <input type="checkbox" [(ngModel)]="settings.auditLogsEnabled">
          </div>

          <div class="save-actions">
            <button class="btn-primary" (click)="saveSettings()">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 880px;
      margin: 0 auto;
      padding: 2rem;
      color: var(--slate-900);
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      color: var(--slate-900);
      font-size: 2.6rem;
      font-weight: 800;
    }

    .page-header p {
      margin-top: .35rem;
      color: var(--slate-600);
    }

    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .settings-card {
      background: var(--card-bg, #fff);
      color: var(--slate-900);
      padding: 1.5rem;
      border-radius: 14px;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-card);
    }

    .card-header {
      margin-bottom: 1.2rem;
      border-bottom: 1px solid var(--slate-200);
      padding-bottom: .9rem;
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--slate-900);
    }

    .card-header h2 {
      margin: 0;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--slate-200);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info h3 {
      margin: 0;
      color: var(--slate-900);
      font-size: 1.05rem;
    }

    .setting-info p {
      margin: .35rem 0 0;
      color: var(--slate-600);
    }

    .input-setting {
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--slate-300);
      border-radius: 8px;
      width: 240px;
      background: var(--card-bg, #fff);
      color: var(--slate-900);
      outline: none;
    }

    .input-setting:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
    }

    .theme-toggle-btn {
      background: var(--slate-300);
      border: none;
      width: 58px;
      height: 30px;
      border-radius: 15px;
      position: relative;
      cursor: pointer;
      transition: background .2s ease;
    }

    .theme-toggle-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .theme-toggle-btn.active {
      background: #4f46e5;
    }

    .toggle-thumb {
      width: 24px;
      height: 24px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 3px;
      left: 3px;
      transition: left .2s ease;
    }

    .theme-toggle-btn.active .toggle-thumb {
      left: 31px;
    }

    .btn-primary {
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .save-actions {
      margin-top: 1rem;
      text-align: right;
    }

    .alert {
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .alert.success {
      background: #dcfce7;
      color: #166534;
    }

    .alert.error {
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 900px) {
      .settings-page {
        padding: 1rem;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .input-setting {
        width: 100%;
      }

      .save-actions {
        width: 100%;
      }

      .save-actions .btn-primary {
        width: 100%;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  isAdmin = false;
  settings: SystemSettings | null = null;
  message = '';
  messageType = '';

  constructor(
    public themeService: ThemeService,
    public adminUiPreferences: AdminUiPreferencesService,
    private adminService: AdminService,
    private auth: SessionService
  ) {}

  ngOnInit() {
    this.isAdmin = this.auth.hasRole('admin');
    if (this.isAdmin) {
      this.loadSettings();
    }
  }

  loadSettings() {
    this.adminService.getSettings().subscribe({
      next: (data) => (this.settings = data),
      error: (err) => console.error('Error loading settings', err)
    });
  }

  saveSettings() {
    if (!this.settings) return;
    this.message = '';
    this.adminService.updateSettings(this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.message = 'Configuración guardada correctamente';
        this.messageType = 'success';
        setTimeout(() => (this.message = ''), 3000);
      },
      error: () => {
        this.message = 'Error al guardar configuración';
        this.messageType = 'error';
      }
    });
  }
}


