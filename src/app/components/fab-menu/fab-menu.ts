import { Component, signal, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../core/data-access/reminder.service';

@Component({
  selector: 'app-fab-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fab-container">
      <!-- Main FAB Button -->
      <button 
        class="fab-main" 
        [class.active]="isOpen()"
        (click)="toggle()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <!-- Actions Menu -->
      <ng-container *ngIf="isOpen()">
        <div class="fab-actions">
          <button class="fab-action" (click)="triggerUpload()">
            <span class="action-icon">📤</span>
            <span class="action-label">Subir archivo</span>
          </button>
          <button class="fab-action" (click)="onNewProject.emit(); close()">
            <span class="action-icon">📁</span>
            <span class="action-label">Nuevo proyecto</span>
          </button>
          <button class="fab-action" (click)="showReminderForm.set(true)">
            <span class="action-icon">⏰</span>
            <span class="action-label">Recordatorio</span>
          </button>
          <ng-container *ngIf="userRole === 'admin' && godModeVisible">
            <button class="fab-action fab-action-special" (click)="onGodMode.emit(); close()">
              <span class="action-icon">🎯</span>
              <span class="action-label">Modo God</span>
            </button>
          </ng-container>
        </div>
      </ng-container>

      <!-- Hidden File Input -->
      <input 
        type="file" 
        #fileInput 
        style="display: none" 
        (change)="onFileSelected($event)"
        multiple>

      <!-- Reminder Modal -->
      <ng-container *ngIf="showReminderForm()">
        <div class="modal-overlay" (click)="showReminderForm.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Nuevo Recordatorio</h3>
            <div class="form-group">
              <label>Título</label>
              <input 
                type="text" 
                [(ngModel)]="reminderTitle" 
                placeholder="¿Qué necesitas recordar?">
            </div>
            <div class="form-group">
              <label>Fecha límite</label>
              <input 
                type="datetime-local" 
                [(ngModel)]="reminderDueDate">
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="showReminderForm.set(false)">Cancelar</button>
              <button class="btn-save" (click)="saveReminder()" [disabled]="!reminderTitle">Guardar</button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .fab-container {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 1000;
    }

    .fab-main {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .fab-main:hover {
      transform: scale(1.05);
      box-shadow: 0 15px 30px -5px rgba(102, 126, 234, 0.5);
    }

    .fab-main.active {
      transform: rotate(135deg);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .fab-main svg {
      width: 28px;
      height: 28px;
    }

    .fab-actions {
      position: absolute;
      bottom: 80px;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
      animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fab-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 9999px;
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .fab-action:hover {
      transform: translateX(-4px);
      background: var(--slate-50);
    }

    .action-icon {
      font-size: 1.25rem;
    }

    .action-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--slate-700);
    }

    .fab-action-special {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-color: rgba(102, 126, 234, 0.3);
    }

    .fab-action-special:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: 2rem;
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--slate-200);
    }

    .modal-content h3 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--slate-900);
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--slate-700);
      margin-bottom: 0.5rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--slate-300);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      transition: border-color 0.2s;
      outline: none;
    }

    .form-group input:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px var(--primary-100);
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn-cancel {
      padding: 0.625rem 1.25rem;
      border: 1px solid var(--slate-300);
      background: white;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--slate-700);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: var(--slate-50);
      border-color: var(--slate-400);
    }

    .btn-save {
      padding: 0.625rem 1.25rem;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-save:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class FabMenuComponent {
  @Input() userRole: string = '';
  @Input() godModeVisible = true;
  @Output() onNewProject = new EventEmitter<void>();
  @Output() onFileUpload = new EventEmitter<File[]>();
  @Output() onGodMode = new EventEmitter<void>();

  isOpen = signal(false);
  showReminderForm = signal(false);
  reminderTitle = '';
  reminderDueDate = '';

  constructor(private reminderService: ReminderService) { }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  triggerUpload(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);
      this.onFileUpload.emit(files);
      this.close();
    }
  }

  saveReminder(): void {
    if (!this.reminderTitle) return;

    this.reminderService.createReminder({
      title: this.reminderTitle,
      dueDate: this.reminderDueDate || undefined
    }).subscribe({
      next: () => {
        this.reminderTitle = '';
        this.reminderDueDate = '';
        this.showReminderForm.set(false);
        this.close();
      },
      error: (err) => console.error('Error creating reminder:', err)
    });
  }
}
