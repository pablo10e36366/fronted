import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersionService, Version } from '../../core/data-access/version.service';

@Component({
    selector: 'app-version-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="version-panel">
      <div class="version-header">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Historial de Versiones
        </h3>
        <button class="btn-create-version" (click)="createSnapshot()" [disabled]="creating">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {{ creating ? 'Creando...' : 'Guardar versión' }}
        </button>
      </div>

      <div class="version-list">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-small"></div>
          Cargando historial...
        </div>

        <div *ngIf="!loading && versions.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>No hay versiones guardadas.</p>
          <span>Haz clic en "Guardar versión" para crear un snapshot.</span>
        </div>

        <div *ngFor="let version of versions; let i = index" 
          class="version-item"
          [class.selected]="selectedVersion?.id === version.id"
          (click)="selectVersion(version)">
          <div class="version-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div class="version-info">
            <span class="version-title">
              {{ version.changeDescription || 'Versión ' + (versions.length - i) }}
            </span>
            <span class="version-meta">
              {{ formatDate(version.createdAt) }} • {{ version.author?.name || 'Usuario' }}
            </span>
          </div>
          <div class="version-actions">
            <button class="btn-action" title="Vista previa" (click)="previewVersion(version); $event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-action btn-restore" title="Restaurar" (click)="confirmRestore(version); $event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div *ngIf="previewingVersion" class="preview-modal-overlay" (click)="closePreview()">
        <div class="preview-modal" (click)="$event.stopPropagation()">
          <div class="preview-header">
            <h4>{{ previewingVersion.changeDescription || 'Vista previa' }}</h4>
            <button class="btn-close" (click)="closePreview()">×</button>
          </div>
          <div class="preview-content">
            <pre>{{ previewingVersion.content }}</pre>
          </div>
          <div class="preview-footer">
            <span class="preview-meta">
              {{ formatDate(previewingVersion.createdAt) }} • {{ previewingVersion.author?.name }}
            </span>
            <button class="btn-restore-preview" (click)="confirmRestore(previewingVersion)">
              Restaurar esta versión
            </button>
          </div>
        </div>
      </div>

      <!-- Create Version Modal -->
      <div *ngIf="showCreateModal" class="preview-modal-overlay" (click)="showCreateModal = false">
        <div class="create-modal" (click)="$event.stopPropagation()">
          <h4>Guardar versión</h4>
          <input 
            type="text" 
            [(ngModel)]="newVersionDescription" 
            placeholder="Descripción del cambio (opcional)"
            (keydown.enter)="saveNewVersion()">
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showCreateModal = false">Cancelar</button>
            <button class="btn-save" (click)="saveNewVersion()">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .version-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-left: 1px solid #e2e8f0;
    }

    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .version-header h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .btn-create-version {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-create-version:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-create-version:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .version-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #64748b;
      text-align: center;
      gap: 0.5rem;
    }

    .empty-state svg {
      opacity: 0.3;
    }

    .empty-state p {
      margin: 0;
      font-weight: 500;
    }

    .empty-state span {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .version-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .version-item:hover {
      background: #f1f5f9;
    }

    .version-item.selected {
      background: #ede9fe;
    }

    .version-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      border-radius: 6px;
      color: #64748b;
    }

    .version-info {
      flex: 1;
      min-width: 0;
    }

    .version-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .version-meta {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .version-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .version-item:hover .version-actions {
      opacity: 1;
    }

    .btn-action {
      background: none;
      border: none;
      padding: 0.375rem;
      cursor: pointer;
      color: #64748b;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .btn-action:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .btn-restore:hover {
      background: #dbeafe;
      color: #2563eb;
    }

    /* Preview Modal */
    .preview-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .preview-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 700px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .preview-header h4 {
      margin: 0;
      font-size: 1rem;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .preview-content {
      flex: 1;
      overflow: auto;
      padding: 1rem 1.5rem;
      background: #f8fafc;
    }

    .preview-content pre {
      margin: 0;
      font-family: 'Fira Code', monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .preview-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .preview-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .btn-restore-preview {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-restore-preview:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    /* Create Modal */
    .create-modal {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      width: 90%;
      max-width: 400px;
    }

    .create-modal h4 {
      margin: 0 0 1rem 0;
    }

    .create-modal input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .btn-cancel, .btn-save {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .btn-cancel {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .btn-save {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
    }
  `]
})
export class VersionHistoryComponent implements OnInit {
    @Input() evidenceId!: string;
    @Output() onRestore = new EventEmitter<Version>();

    versions: Version[] = [];
    selectedVersion: Version | null = null;
    previewingVersion: Version | null = null;
    loading = false;
    creating = false;
    showCreateModal = false;
    newVersionDescription = '';

    constructor(private versionService: VersionService) { }

    ngOnInit(): void {
        this.loadVersions();
    }

    loadVersions(): void {
        if (!this.evidenceId) return;

        this.loading = true;
        this.versionService.getVersions(this.evidenceId).subscribe({
            next: (versions) => {
                this.versions = versions;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    createSnapshot(): void {
        this.showCreateModal = true;
        this.newVersionDescription = '';
    }

    saveNewVersion(): void {
        this.showCreateModal = false;
        this.creating = true;

        this.versionService.createVersion(this.evidenceId, this.newVersionDescription || undefined).subscribe({
            next: (version) => {
                this.versions.unshift(version);
                this.creating = false;
            },
            error: () => {
                this.creating = false;
            }
        });
    }

    selectVersion(version: Version): void {
        this.selectedVersion = this.selectedVersion?.id === version.id ? null : version;
    }

    previewVersion(version: Version): void {
        this.previewingVersion = version;
    }

    closePreview(): void {
        this.previewingVersion = null;
    }

    confirmRestore(version: Version): void {
        if (!confirm(`¿Restaurar a la versión "${version.changeDescription || 'anterior'}"? El contenido actual se guardará como nueva versión.`)) {
            return;
        }

        this.versionService.restoreVersion(this.evidenceId, version.id).subscribe({
            next: (restored) => {
                this.closePreview();
                this.loadVersions();
                this.onRestore.emit(restored);
            }
        });
    }

    formatDate(date: Date): string {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
