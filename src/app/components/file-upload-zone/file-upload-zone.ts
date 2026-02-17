import { Component, Output, EventEmitter, signal, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload-zone',
  standalone: true,
  imports: [CommonModule],
  template: `
	    <div 
	      class="upload-zone"
	      [class.compact]="compact"
	      [class.dragover]="isDragOver()"
	      [class.has-file]="selectedFile()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      
      <input 
        #fileInput
        type="file"
        [accept]="acceptedTypes"
        (change)="onFileSelected($event)"
        hidden>
      
      <ng-container *ngIf="selectedFile()">
        <div class="file-preview">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div class="file-info">
            <span class="file-name">{{ selectedFile()?.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile()?.size || 0) }}</span>
          </div>
          <button class="remove-btn" (click)="removeFile($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </ng-container>
      <ng-container *ngIf="!selectedFile()">
        <div class="upload-content">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
	          </div>
	          <p class="upload-text">
	            <strong>{{ labelStrong }}</strong>
	            <span>{{ labelSub }}</span>
	          </p>
	          <span class="upload-hint">{{ hintText }}</span>
	        </div>
	      </ng-container>
    </div>
  `,
  styles: [`
	    .upload-zone {
	      border: 2px dashed rgba(102, 126, 234, 0.3);
	      border-radius: 16px;
	      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    }

	    .upload-zone:hover {
	      border-color: #667eea;
	      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
	    }

	    .upload-zone.compact {
	      padding: 1.25rem;
	    }

	    .upload-zone.compact .upload-icon {
	      width: 42px;
	      height: 42px;
	      border-radius: 12px;
	    }

	    .upload-zone.compact .upload-icon svg {
	      width: 22px;
	      height: 22px;
	    }

	    .upload-zone.dragover {
	      border-color: #667eea;
	      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
	      transform: scale(1.02);
    }

    .upload-zone.has-file {
      border-style: solid;
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.05);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .upload-icon svg {
      width: 24px;
      height: 24px;
    }

    .upload-text {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .upload-text strong {
      color: #1e293b;
      font-size: 0.95rem;
    }

    .upload-text span {
      color: #64748b;
      font-size: 0.85rem;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      text-align: left;
    }

    .file-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .file-icon svg {
      width: 22px;
      height: 22px;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .file-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.8rem;
      color: #64748b;
    }

    .remove-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: #fee2e2;
      color: #ef4444;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .remove-btn:hover {
      background: #ef4444;
      color: white;
    }

    .remove-btn svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class FileUploadZoneComponent {
  @Output() fileSelected = new EventEmitter<File>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() acceptedTypes = '.pdf,.docx,.doc,.zip,.rar,.xlsx,.pptx';
  @Input() compact = false;
  @Input() maxSizeMb = 10;
  @Input() labelStrong = 'Arrastra tu archivo aquí';
  @Input() labelSub = 'o haz clic para seleccionar';
  @Input() hintText = 'PDF, DOCX, ZIP (máx. 10MB)';
  isDragOver = signal(false);
  selectedFile = signal<File | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    const maxBytes = Math.max(1, this.maxSizeMb) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`El archivo es demasiado grande. Máximo ${this.maxSizeMb}MB.`);
      return;
    }

    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.fileSelected.emit(undefined as any);
  }

  reset(): void {
    this.selectedFile.set(null);
    // No emitimos evento aquí porque el padre ya controló el éxito
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
