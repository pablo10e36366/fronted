import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EvidenceType, CreateEvidenceDto } from '../../core/models/project.models';
import { FileUploadZoneComponent } from '../file-upload-zone/file-upload-zone';
import { EvidenceService } from '../../core/data-access/evidence.service';
import { SessionService } from '../../core/auth/data-access/session.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-evidence-dialog',
  standalone: true,
	  imports: [
	    CommonModule,
	    FormsModule,
	    ReactiveFormsModule,
	    MatDialogModule,
	    MatButtonModule,
	    MatFormFieldModule,
	    MatInputModule,
	    MatSelectModule,
	    FileUploadZoneComponent
	  ],
	  template: `
	    <div class="dialog-container">
	      <h2 mat-dialog-title>Commit new evidence</h2>

      <mat-dialog-content>
        <form [formGroup]="form" class="evidence-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Commit message / Title</mat-label>
            <input matInput formControlName="title" placeholder="Describe your changes">
            <mat-error *ngIf="form.get('title')?.hasError('required')">
              Title is required
            </mat-error>
          </mat-form-field>

	          <mat-form-field appearance="outline" class="full-width">
	            <mat-label>Type</mat-label>
	            <mat-select formControlName="type">
	              <mat-option value="FILE">File</mat-option>
	              <mat-option value="TEXT" [disabled]="isTeacher">Text</mat-option>
	              <mat-option value="LINK" [disabled]="isTeacher">Link</mat-option>
	            </mat-select>
	          </mat-form-field>

	          <div *ngIf="form.get('type')?.value === 'FILE'">
	            <app-file-upload-zone
	              [compact]="true"
	              [labelStrong]="'Arrastra el archivo de la actividad aquí'"
	              [labelSub]="'o haz clic para seleccionar'"
	              [hintText]="'Se subirá para que los estudiantes lo descarguen'"
	              (fileSelected)="onFileSelected($event)">
	            </app-file-upload-zone>
	            <div *ngIf="isTeacher && !data.parentId" class="file-warning">
	              Para subir material del profesor, primero entra a una carpeta (actividad).
	            </div>
	            <p class="file-note">
	              Sugerencia: crea primero una carpeta con el nombre de la actividad y sube el material dentro.
	            </p>
	          </div>

	          <mat-form-field appearance="outline" class="full-width" *ngIf="form.get('type')?.value === 'LINK'">
	            <mat-label>URL</mat-label>
	            <input matInput formControlName="content" placeholder="https://example.com">
            <mat-error *ngIf="form.get('content')?.hasError('required')">
              URL is required
            </mat-error>
            <mat-error *ngIf="form.get('content')?.hasError('pattern')">
              Please enter a valid URL
            </mat-error>
          </mat-form-field>

	          <mat-form-field appearance="outline" class="full-width" *ngIf="form.get('type')?.value === 'TEXT'">
	            <mat-label>Content (Markdown supported)</mat-label>
	            <textarea matInput formControlName="content" rows="6" placeholder="Write your evidence content..."></textarea>
	            <mat-error *ngIf="form.get('content')?.hasError('required')">
	              Content is required
	            </mat-error>
	          </mat-form-field>
	        </form>
	      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
	        <button
	          mat-flat-button
	          color="primary"
	          (click)="onSubmit()"
	          [disabled]="form.invalid || isSubmitting || (form.get('type')?.value === 'FILE' && (!selectedFile || (isTeacher && !data.parentId)))">
	          {{ isSubmitting ? 'Committing...' : 'Commit changes' }}
	        </button>
	      </mat-dialog-actions>
	    </div>
	  `,
	  styles: [`
    .dialog-container {
      min-width: 480px;
    }

    .evidence-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }

	    .file-upload-disabled {
	      padding: 16px;
	      background: #f6f8fa;
	      border-radius: 6px;
	      text-align: center;
	      color: #57606a;
	    }

	    .file-note {
	      margin: 8px 0 0;
	      font-size: 0.85rem;
	      color: #64748b;
	    }

	    .file-warning {
	      margin-top: 10px;
	      padding: 10px 12px;
	      border-radius: 10px;
	      background: rgba(245, 158, 11, 0.12);
	      border: 1px solid rgba(245, 158, 11, 0.25);
	      color: #92400e;
	      font-size: 0.85rem;
	    }

	    mat-dialog-content {
	      min-height: 200px;
	    }
	  `]
	})
export class EvidenceDialogComponent implements OnDestroy {
	  form: FormGroup;
	  isSubmitting = false;
	  selectedFile: File | null = null;
	  isTeacher = false;
	  private readonly subscriptions = new Subscription();

	  constructor(
	    private fb: FormBuilder,
	    private dialogRef: MatDialogRef<EvidenceDialogComponent>,
	    private evidenceService: EvidenceService,
	    private SessionService: SessionService,
	    @Inject(MAT_DIALOG_DATA) public data: { projectId: string; parentId?: string | null }
	  ) {
	    const role = (this.SessionService.getRole() ?? '').toLowerCase();
	    this.isTeacher = role === 'docente';
	    const initialType = this.isTeacher ? 'FILE' : 'LINK';

	    this.form = this.fb.group({
	      title: ['', Validators.required],
	      type: [initialType, Validators.required],
	      content: [''],
	    });

	    this.applyValidatorsForType(initialType);
	    const typeCtrl = this.form.get('type');
	    if (typeCtrl) {
	      this.subscriptions.add(
	        typeCtrl.valueChanges.subscribe((value) => {
	          this.applyValidatorsForType(String(value || '').toUpperCase());
	        }),
	      );
	    }
	  }

	  ngOnDestroy(): void {
	    this.subscriptions.unsubscribe();
	  }

	  private applyValidatorsForType(type: string): void {
	    const contentCtrl = this.form.get('content');
	    if (!contentCtrl) return;

	    contentCtrl.clearValidators();

	    if (type === 'LINK') {
	      contentCtrl.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
	    } else if (type === 'TEXT') {
	      contentCtrl.setValidators([Validators.required]);
	    }

	    contentCtrl.updateValueAndValidity({ emitEvent: false });

	    if (type !== 'FILE') {
	      this.selectedFile = null;
	    }
	  }

	  onFileSelected(file: File | null | undefined): void {
	    this.selectedFile = file ?? null;
	    if (this.selectedFile && !this.form.get('title')?.value) {
	      this.form.patchValue({ title: this.selectedFile.name });
	    }
	  }

	  onCancel(): void {
	    this.dialogRef.close();
	  }

	  onSubmit(): void {
	    if (!this.form.valid) return;

	    const type = this.form.value.type as EvidenceType;
	    this.isSubmitting = true;

	    if (type === 'FILE') {
	      if (!this.selectedFile) {
	        this.isSubmitting = false;
	        return;
	      }
	      if (this.isTeacher && !this.data.parentId) {
	        this.isSubmitting = false;
	        return;
	      }

	      this.evidenceService
	        .createFile({
	          projectId: this.data.projectId,
	          parentId: this.data.parentId ?? null,
	          name: this.form.value.title,
	          file: this.selectedFile,
	        })
	        .subscribe({
	          next: () => this.dialogRef.close({ uploaded: true }),
	          error: () => {
	            this.isSubmitting = false;
	          },
	        });
	      return;
	    }

	    const evidenceData: CreateEvidenceDto = {
	      title: this.form.value.title,
	      type,
	      content: this.form.value.content,
	      projectId: this.data.projectId,
	    };
	    this.dialogRef.close(evidenceData);
	  }
	}

