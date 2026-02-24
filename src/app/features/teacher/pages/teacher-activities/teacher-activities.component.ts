import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { FileUploadZoneComponent } from '../../../../components/file-upload-zone/file-upload-zone';
import { EvidenceApiService } from '../../../../core/data-access/evidence-api.service';
import type { TeacherActivityFeedEvent } from '../../../../core/models/teacher.models';
import { TeacherService } from '../../data-access/teacher.service';

type ActivityType = 'LESSON' | 'TASK' | 'FILE' | 'PAGE';

@Component({
  selector: 'app-teacher-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FileUploadZoneComponent],
  templateUrl: './teacher-activities.component.html',
  styleUrls: ['./teacher-activities.component.css'],
})
export class TeacherActivitiesComponent implements OnInit, OnDestroy {
  courseId: string | null = null;
  courseTitle = '';

  activityType: ActivityType = 'TASK';
  activityTitle = '';
  activityDeadlineLocal = '';
  activityFile: File | null = null;
  activitySaving = false;
  activityError = '';
  activitySuccess = '';

  feedLoading = false;
  feedError = '';
  feedEvents: TeacherActivityFeedEvent[] = [];
  feedPage = 1;
  feedPageSize = 20;
  feedTotal = 0;
  deletingActivityIds = new Set<string>();

  @ViewChild('activityEditor') activityEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evidenceApiService: EvidenceApiService,
    private teacherService: TeacherService,
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      this.courseId = params.get('courseId');
      this.resetActivityForm(false);
      this.loadCourseTitle();
      this.resetFeed();
      this.loadFeed();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  backToCourse(): void {
    if (!this.courseId) return;
    this.router.navigate(['/projects', this.courseId]);
  }

  onActivityFileSelected(file: File | undefined): void {
    this.activityFile = file || null;
    this.activityError = '';
    this.activitySuccess = '';
  }

  onEditorInput(): void {
    this.activityError = '';
    this.activitySuccess = '';
  }

  format(command: 'bold' | 'italic'): void {
    this.focusEditor();
    document.execCommand(command, false);
    this.onEditorInput();
  }

  addLink(): void {
    const raw = (prompt('Pega el enlace (https://...)') || '').trim();
    if (!raw) return;
    const url = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`;
    this.focusEditor();
    document.execCommand('createLink', false, url);
    this.onEditorInput();
  }

  triggerImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  onImagePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.activityError = 'Selecciona una imagen válida (PNG/JPG/WebP).';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.activityError = 'La imagen es demasiado grande (máx. 5MB).';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.focusEditor();
      document.execCommand('insertImage', false, dataUrl);
      this.onEditorInput();
    };
    reader.onerror = () => {
      this.activityError = 'No se pudo leer la imagen.';
    };
    reader.readAsDataURL(file);
  }

  createActivity(): void {
    if (!this.courseId) return;

    const name = this.activityTitle.trim();
    if (!name) {
      this.activityError = 'El nombre de la actividad es requerido.';
      return;
    }

    if (this.activityType === 'FILE' && !this.activityFile) {
      this.activityError = 'Selecciona el archivo que quieres publicar para tus estudiantes.';
      return;
    }

    const description = this.getActivityDescriptionHtml();
    const deadlineIso = this.getDeadlineIsoForRequest();
    if (deadlineIso === undefined) {
      return;
    }

    this.activitySaving = true;
    this.activityError = '';
    this.activitySuccess = '';

    this.teacherService
      .createCourseActivity(this.courseId, {
        title: name,
        description: description || null,
        type: this.activityType,
        deadline: deadlineIso,
      })
      .subscribe({
        next: (res) => {
          const folderId = res?.data?.folder_id;
          const milestoneId = res?.data?.milestone_id;
          const responseDeadline =
            res?.data?.deadline ??
            (res?.data as any)?.due_at ??
            (res?.data as any)?.dueAt ??
            (res?.data as any)?.due_date ??
            null;
          const deadlineLabel = this.formatDeadlineLabel(responseDeadline);

          if (this.activityType === 'FILE' && this.activityFile && folderId) {
            this.evidenceApiService
              .createFile({
                projectId: this.courseId!,
                milestoneId: milestoneId || undefined,
                parentId: folderId,
                name: this.activityFile.name,
                file: this.activityFile,
              })
              .subscribe({
                next: () => {
                  this.activitySaving = false;
                  this.activitySuccess = deadlineLabel
                    ? `Actividad publicada con fecha límite (${deadlineLabel}). El archivo quedó disponible en Archivos dentro del curso.`
                    : 'Actividad publicada. El archivo quedó disponible en Archivos dentro del curso.';
                  this.resetActivityForm(true);
                  this.resetFeed();
                  this.loadFeed();
                },
                error: (err: any) => {
                  this.activitySaving = false;
                  this.activityError =
                    typeof err === 'string'
                      ? err
                      : err?.message || 'No se pudo subir el archivo';
                },
              });
            return;
          }

          this.activitySaving = false;
          this.activitySuccess = deadlineLabel
            ? `Actividad publicada con fecha límite (${deadlineLabel}). Ya puedes recibir evidencias en Archivos.`
            : 'Actividad publicada. Ya puedes recibir evidencias en Archivos.';
          this.resetActivityForm(true);
          this.resetFeed();
          this.loadFeed();
        },
        error: (err: any) => {
          this.activitySaving = false;
          this.activityError =
            typeof err === 'string'
              ? err
              : err?.message || 'No se pudo publicar la actividad';
        },
      });
  }

  resetActivityBuilder(): void {
    this.resetActivityForm(false);
  }

  private loadCourseTitle(): void {
    if (!this.courseId) {
      this.courseTitle = '';
      return;
    }
    this.teacherService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.courseTitle = course?.data?.name || '';
      },
      error: () => {
        this.courseTitle = '';
      },
    });
  }

  private resetActivityForm(keepMessages: boolean): void {
    this.activityType = 'TASK';
    this.activityTitle = '';
    this.activityDeadlineLocal = '';
    this.activityFile = null;
    if (!keepMessages) {
      this.activityError = '';
      this.activitySuccess = '';
    }
    const editor = this.activityEditor?.nativeElement;
    if (editor) editor.innerHTML = '';
  }

  private focusEditor(): void {
    const editor = this.activityEditor?.nativeElement;
    if (!editor) return;
    editor.focus();
  }

  private getActivityDescriptionHtml(): string {
    const editor = this.activityEditor?.nativeElement;
    if (!editor) return '';
    const text = (editor.textContent || '').trim();
    if (!text) return '';
    return (editor.innerHTML || '').trim();
  }

  private getDeadlineIsoForRequest(): string | null | undefined {
    const raw = this.activityDeadlineLocal.trim();
    if (!raw) return null;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      this.activityError = 'La fecha límite no es válida.';
      return undefined;
    }

    if (parsed.getTime() <= Date.now()) {
      this.activityError = 'La fecha límite debe ser futura.';
      return undefined;
    }

    return parsed.toISOString();
  }

  private formatDeadlineLabel(deadline?: string | null): string {
    if (!deadline) return '';
    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString();
  }

  private resetFeed(): void {
    this.feedEvents = [];
    this.feedPage = 1;
    this.feedTotal = 0;
    this.feedError = '';
  }

  loadFeed(): void {
    if (!this.courseId) return;

    this.feedLoading = true;
    this.feedError = '';

    this.teacherService
      .getCourseActivityFeed(this.courseId, {
        page: this.feedPage,
        page_size: this.feedPageSize,
      })
      .subscribe({
        next: (res) => {
          const items = res.data?.items || [];
          this.feedEvents = [...this.feedEvents, ...items];
          this.feedTotal = res.meta?.total || this.feedEvents.length;
          this.feedLoading = false;
        },
        error: (err: any) => {
          this.feedLoading = false;
          this.feedError =
            typeof err === 'string'
              ? err
              : err?.message || 'No se pudo cargar el feed';
        },
      });
  }

  loadMoreFeed(): void {
    if (this.feedLoading) return;
    if (this.feedEvents.length >= this.feedTotal) return;
    this.feedPage += 1;
    this.loadFeed();
  }

  getActivityIdFromEvent(event: TeacherActivityFeedEvent): string | null {
    const metadata = event?.metadata as Record<string, unknown> | null | undefined;
    const entityId = event?.entity_id;
    if (typeof entityId === 'string' && entityId.trim().length > 0) {
      return entityId;
    }

    const milestoneId = metadata?.['milestoneId'];
    if (typeof milestoneId === 'string' && milestoneId.trim().length > 0) {
      return milestoneId;
    }

    const milestoneIdSnake = metadata?.['milestone_id'];
    return typeof milestoneIdSnake === 'string' && milestoneIdSnake.trim().length > 0
      ? milestoneIdSnake
      : null;
  }

  canDeleteActivity(event: TeacherActivityFeedEvent): boolean {
    return event.type === 'announcement_created' && !!this.getActivityIdFromEvent(event);
  }

  isDeletingActivity(event: TeacherActivityFeedEvent): boolean {
    const activityId = this.getActivityIdFromEvent(event);
    return !!activityId && this.deletingActivityIds.has(activityId);
  }

  deleteActivity(event: TeacherActivityFeedEvent): void {
    if (!this.courseId) return;
    const activityId = this.getActivityIdFromEvent(event);
    if (!activityId) return;
    if (this.deletingActivityIds.has(activityId)) return;

    const confirmed = confirm('¿Eliminar esta actividad publicada? Esta acción también elimina sus entregas asociadas.');
    if (!confirmed) return;

    this.activityError = '';
    this.activitySuccess = '';
    this.deletingActivityIds.add(activityId);

    this.teacherService.deleteCourseActivity(this.courseId, activityId).subscribe({
      next: () => {
        this.deletingActivityIds.delete(activityId);
        this.activitySuccess = 'Actividad eliminada correctamente.';
        this.resetFeed();
        this.loadFeed();
      },
      error: (err: any) => {
        this.deletingActivityIds.delete(activityId);
        this.activityError =
          typeof err === 'string'
            ? err
            : err?.message || 'No se pudo eliminar la actividad';
      },
    });
  }
}
