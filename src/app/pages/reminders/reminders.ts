import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReminderService, Reminder } from '../../core/data-access/reminder.service';

@Component({
    selector: 'app-reminders',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="reminders-page">
      <header class="page-header">
        <h1>Mis Recordatorios</h1>
        <p>Gestiona tus tareas pendientes</p>
      </header>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando recordatorios...</p>
      </div>

      <div *ngIf="error" class="error-box">
        ❌ {{ error }}
      </div>

      <div *ngIf="message" class="success-box">
        ✅ {{ message }}
      </div>

      <div *ngIf="!loading" class="reminders-content">
        <!-- Estadísticas -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ reminders.length }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ getPendingCount() }}</div>
            <div class="stat-label">Pendientes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ getCompletedCount() }}</div>
            <div class="stat-label">Completados</div>
          </div>
        </div>

        <!-- Lista de recordatorios -->
        <div class="reminders-list" *ngIf="reminders.length > 0; else emptyState">
          <div 
            *ngFor="let reminder of reminders" 
            class="reminder-card"
            [class.completed]="reminder.isCompleted">
            
            <div class="reminder-checkbox">
              <input 
                type="checkbox" 
                [checked]="reminder.isCompleted"
                (change)="toggleComplete(reminder)"
                [disabled]="processingId === reminder.id">
            </div>

            <div class="reminder-content">
              <h3 [class.strikethrough]="reminder.isCompleted">{{ reminder.title }}</h3>
              <p *ngIf="reminder.description" class="description">{{ reminder.description }}</p>
              
              <div class="reminder-meta">
                <span class="created-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Creado: {{ reminder.createdAt | date:'short' }}
                </span>
                
                <span *ngIf="reminder.dueDate" class="due-date" [class.overdue]="isOverdue(reminder)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Vence: {{ reminder.dueDate | date:'short' }}
                </span>
              </div>
            </div>

            <div class="reminder-actions">
              <button 
                class="btn-icon btn-delete" 
                (click)="deleteReminder(reminder)"
                [disabled]="processingId === reminder.id"
                title="Eliminar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3>No tienes recordatorios</h3>
            <p>Crea uno nuevo usando el botón flotante (+)</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
    styles: [`
    .reminders-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: var(--slate-500);
      font-size: 0.95rem;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--slate-500);
      margin-top: 0.25rem;
    }

    /* Reminders List */
    .reminders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .reminder-card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.2s;
    }

    .reminder-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-color: var(--slate-300);
    }

    .reminder-card.completed {
      opacity: 0.6;
      background: var(--slate-50);
    }

    .reminder-checkbox input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
      margin-top: 2px;
    }

    .reminder-content {
      flex: 1;
    }

    .reminder-content h3 {
      margin: 0 0 0.5rem;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--slate-800);
    }

    .reminder-content h3.strikethrough {
      text-decoration: line-through;
      color: var(--slate-500);
    }

    .description {
      margin: 0 0 0.75rem;
      color: var(--slate-600);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .reminder-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--slate-500);
    }

    .reminder-meta > span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .due-date.overdue {
      color: #dc2626;
      font-weight: 600;
    }

    .reminder-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      border-radius: 6px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover {
      background: var(--slate-100);
    }

    .btn-delete {
      color: #dc2626;
    }

    .btn-delete:hover {
      background: #fee2e2;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--slate-400);
    }

    .empty-state svg {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: var(--slate-600);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--slate-500);
    }

    /* Loading */
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

    /* Messages */
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
export class RemindersComponent implements OnInit {
    reminders: Reminder[] = [];
    loading = false;
    error = '';
    message = '';
    processingId: string | null = null;

    constructor(private reminderService: ReminderService) { }

    ngOnInit() {
        this.loadReminders();
    }

    loadReminders() {
        this.loading = true;
        this.error = '';
        this.reminderService.getReminders().subscribe({
            next: (data) => {
                this.reminders = data.sort((a, b) => {
                    // Pendientes primero, luego por fecha de creación
                    if (a.isCompleted !== b.isCompleted) {
                        return a.isCompleted ? 1 : -1;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error al cargar recordatorios';
                this.loading = false;
                console.error('Error loading reminders:', err);
            }
        });
    }

    toggleComplete(reminder: Reminder) {
        this.processingId = reminder.id;
        this.error = '';
        this.message = '';

        const newStatus = !reminder.isCompleted;
        this.reminderService.updateReminder(reminder.id, { isCompleted: newStatus }).subscribe({
            next: (updated) => {
                const index = this.reminders.findIndex(r => r.id === reminder.id);
                if (index !== -1) {
                    this.reminders[index] = updated;
                    // Re-sort the list
                    this.reminders = this.reminders.sort((a, b) => {
                        if (a.isCompleted !== b.isCompleted) {
                            return a.isCompleted ? 1 : -1;
                        }
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                }
                this.message = newStatus ? 'Recordatorio marcado como completado' : 'Recordatorio marcado como pendiente';
                this.processingId = null;
                setTimeout(() => this.message = '', 2000);
            },
            error: (err) => {
                this.error = 'Error al actualizar recordatorio';
                this.processingId = null;
                console.error('Error updating reminder:', err);
            }
        });
    }

    deleteReminder(reminder: Reminder) {
        if (!confirm(`¿Estás seguro de eliminar "${reminder.title}"?`)) {
            return;
        }

        this.processingId = reminder.id;
        this.error = '';
        this.message = '';

        this.reminderService.deleteReminder(reminder.id).subscribe({
            next: () => {
                this.reminders = this.reminders.filter(r => r.id !== reminder.id);
                this.message = 'Recordatorio eliminado correctamente';
                this.processingId = null;
                setTimeout(() => this.message = '', 2000);
            },
            error: (err) => {
                this.error = 'Error al eliminar recordatorio';
                this.processingId = null;
                console.error('Error deleting reminder:', err);
            }
        });
    }

    getPendingCount(): number {
        return this.reminders.filter(r => !r.isCompleted).length;
    }

    getCompletedCount(): number {
        return this.reminders.filter(r => r.isCompleted).length;
    }

    isOverdue(reminder: Reminder): boolean {
        if (!reminder.dueDate || reminder.isCompleted) {
            return false;
        }
        return new Date(reminder.dueDate) < new Date();
    }
}
