import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemSettings } from '../../../../core/data-access/admin.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-settings">
      <h2>Configuración del Sistema</h2>
      
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando configuración...</p>
      </div>

      <div *ngIf="error" class="error-box">
        ❌ {{ error }}
      </div>

      <div *ngIf="message" class="success-box">
        ✅ {{ message }}
      </div>

      <div *ngIf="settings && !loading" class="settings-grid">
        <div class="setting-card">
          <h3>📦 Almacenamiento</h3>
          <div class="field">
             <label>Límite por usuario (MB)</label>
             <input type="number" [(ngModel)]="settings.storageLimit" min="1">
          </div>
          <div class="field">
             <label>Tipos de archivos permitidos (separados por coma)</label>
             <input type="text" [(ngModel)]="settings.allowedFileTypes">
          </div>
        </div>

        <div class="setting-card">
          <h3>🔐 Seguridad</h3>
          <div class="toggle-field">
             <span>Logs de Auditoría</span>
             <label class="toggle-switch">
               <input type="checkbox" [(ngModel)]="settings.auditLogsEnabled">
               <span class="slider"></span>
             </label>
          </div>
        </div>

        <div class="setting-card">
          <h3>🛑 Reglas de Negocio</h3>
          <div class="field">
             <label>Tiempo máximo en Revisión (días)</label>
             <input type="number" [(ngModel)]="settings.maxReviewDays" min="1">
          </div>
        </div>
      </div>
      
      <div *ngIf="settings && !loading" class="actions">
        <button class="btn btn-primary" (click)="saveSettings()" [disabled]="saving">
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-settings { padding: 1rem; max-width: 1200px; margin: 0 auto; color: var(--slate-800); }
    h2 { margin-bottom: 2rem; color: var(--slate-800); }
    
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    
    .setting-card {
      background: var(--card-bg, #fff);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-card);
    }
    h3 { margin-top: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--slate-100); font-size: 1rem; color: var(--slate-600); }
    
    .field { margin-top: 1rem; }
    label { display: block; font-size: 0.85rem; color: var(--slate-500); margin-bottom: 0.3rem; }
    input[type="text"], input[type="number"] { 
      width: 100%; 
      padding: 0.5rem; 
      border: 1px solid var(--slate-200); 
      border-radius: 6px; 
      background: var(--card-bg, #fff); 
      color: var(--slate-800); 
      font-family: inherit;
    }
    input[type="text"]:focus, input[type="number"]:focus {
      outline: none;
      border-color: var(--primary-600);
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
    
    .toggle-field { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-top: 1rem; 
      padding: 0.5rem 0; 
      color: var(--slate-700);
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--slate-300);
      transition: 0.3s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: var(--card-bg, #fff);
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .success-box { 
      margin-bottom: 1rem; 
      padding: 1rem; 
      background: #dcfce7; 
      color: #166534; 
      border-radius: 8px; 
      font-size: 0.9rem; 
    }

    .error-box { 
      margin-bottom: 1rem; 
      padding: 1rem; 
      background: #fee2e2; 
      color: #991b1b; 
      border-radius: 8px; 
      font-size: 0.9rem; 
    }
  `]
})
export class AdminSettingsComponent implements OnInit {
  settings: SystemSettings | null = null;
  loading = false;
  saving = false;
  error = '';
  message = '';

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.error = '';
    this.adminService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la configuración del sistema';
        this.loading = false;
        console.error('Error loading settings:', err);
      }
    });
  }

  saveSettings() {
    if (!this.settings) return;

    this.saving = true;
    this.error = '';
    this.message = '';

    this.adminService.updateSettings(this.settings).subscribe({
      next: (updated) => {
        this.settings = updated;
        this.message = 'Configuración guardada correctamente';
        this.saving = false;
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al guardar la configuración';
        this.saving = false;
        console.error('Error saving settings:', err);
      }
    });
  }
}
