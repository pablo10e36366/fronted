import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest, Subscription, firstValueFrom } from 'rxjs';

import { FileUploadZoneComponent } from '../../../../components/file-upload-zone/file-upload-zone';
import { EvidenceApiService } from '../../../../core/data-access/evidence-api.service';
import type { CreateEvidenceDto } from '../../../../core/models/project.models';
import { StudentService } from '../../data-access/student.service';
import type { StudentAssignmentListItem } from '../../../../core/models/student.models';

@Component({
  selector: 'app-student-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FileUploadZoneComponent],
  templateUrl: './student-activities.component.html',
  styleUrls: ['./student-activities.component.css'],
})
export class StudentActivitiesComponent implements OnInit, OnDestroy {
  courseId = '';
  selectedMilestoneId = '';
  loading = false;
  errorMessage = '';

  items: StudentAssignmentListItem[] = [];
  selectedAssignmentId = '';
  selectedAssignment: StudentAssignmentListItem | null = null;

  submissionText = '';
  linkInput = '';
  links: string[] = [];
  submissionFile: File | null = null;
  submitting = false;
  submitError = '';
  submitSuccess = '';

  private sub?: Subscription;
  @ViewChild('submissionUploadZone') submissionUploadZone?: FileUploadZoneComponent;

  constructor(
    private studentService: StudentService,
    private evidenceApiService: EvidenceApiService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, qp]) => {
      this.courseId = params.get('courseId') || '';
      this.selectedMilestoneId = qp.get('milestone_id') || '';
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private load(): void {
    if (!this.courseId) return;
    this.loading = true;
    this.errorMessage = '';

    this.studentService
      .getAssignments({ course_id: this.courseId, page: 1, page_size: 50, sort: 'deadline_asc' })
      .subscribe({
        next: (res) => {
          this.items = res.data?.items || [];
          this.syncSelection();
          this.loading = false;
          this.focusSelectedMilestone();
        },
        error: (err: any) => {
          this.loading = false;
          this.items = [];
          this.errorMessage =
            typeof err === 'string' ? err : err?.message || 'No se pudieron cargar las actividades';
        },
      });
  }

  statusLabel(item: Pick<StudentAssignmentListItem, 'status' | 'review_outcome'>): string {
    if (item.review_outcome === 'CHANGES_REQUESTED') return 'Cambios solicitados';
    if (item.review_outcome === 'APPROVED') return 'Aprobado';

    switch (item.status) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ENTREGADO':
        return 'Entregado';
      case 'REVISADO':
        return 'Revisado';
      default:
        return item.status;
    }
  }

  isSelectedMilestone(item: StudentAssignmentListItem): boolean {
    return !!this.selectedMilestoneId && item.milestone_id === this.selectedMilestoneId;
  }

  selectAssignment(item: StudentAssignmentListItem): void {
    this.selectedAssignment = item;
    this.selectedAssignmentId = item.id;
    this.submitError = '';
    this.submitSuccess = '';
  }

  onSubmissionFileSelected(file?: File): void {
    this.submissionFile = file || null;
    this.submitError = '';
  }

  addLink(): void {
    const normalized = this.normalizeLink(this.linkInput);
    if (!normalized) return;

    if (!this.links.includes(normalized)) {
      this.links = [...this.links, normalized];
    }
    this.linkInput = '';
    this.submitError = '';
  }

  removeLink(index: number): void {
    this.links = this.links.filter((_, i) => i !== index);
  }

  clearSubmissionDraft(clearMessages = true): void {
    this.submissionText = '';
    this.linkInput = '';
    this.links = [];
    this.submissionFile = null;
    this.submissionUploadZone?.reset();
    if (clearMessages) {
      this.submitError = '';
      this.submitSuccess = '';
    }
  }

  async submitAssignment(): Promise<void> {
    if (!this.courseId) return;
    const assignment = this.selectedAssignment;
    if (!assignment) {
      this.submitError = 'Selecciona una actividad para entregar.';
      return;
    }
    if (!assignment.milestone_id) {
      this.submitError = 'Esta actividad no tiene milestone asociado.';
      return;
    }
    if (assignment.status !== 'PENDIENTE') {
      this.submitError = 'Solo puedes entregar actividades pendientes.';
      return;
    }

    const text = this.submissionText.trim();
    const hasFile = !!this.submissionFile;
    const hasLinks = this.links.length > 0;
    if (!hasFile && !text && !hasLinks) {
      this.submitError = 'Agrega texto, un enlace o un archivo para entregar.';
      return;
    }

    this.submitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    let assignmentMarkedAsDelivered = false;
    let successfulParts = 0;
    let firstErrorMessage = '';

    const submitPart = async (request: Promise<unknown>): Promise<boolean> => {
      try {
        await request;
        successfulParts += 1;
        return true;
      } catch (err: any) {
        if (!firstErrorMessage) {
          firstErrorMessage = this.getErrorMessage(err, 'No se pudo enviar la entrega');
        }
        return false;
      }
    };

    if (this.submissionFile) {
      const fileSaved = await submitPart(
        firstValueFrom(
          this.evidenceApiService.createFile({
            projectId: this.courseId,
            milestoneId: assignment.milestone_id,
            parentId: assignment.activity_folder_id || undefined,
            name: this.submissionFile.name,
            file: this.submissionFile,
          }),
        ),
      );
      if (fileSaved) {
        assignmentMarkedAsDelivered = true;
      }
    }

    if (text) {
      const textSaved = await submitPart(
        firstValueFrom(
          this.evidenceApiService.createEvidence(
            this.courseId,
            this.buildTextEvidencePayload(assignment, text, assignmentMarkedAsDelivered),
          ),
        ),
      );
      if (textSaved) {
        assignmentMarkedAsDelivered = true;
      }
    }

    for (const link of this.links) {
      const linkSaved = await submitPart(
        firstValueFrom(
          this.evidenceApiService.createEvidence(
            this.courseId,
            this.buildLinkEvidencePayload(assignment, link, assignmentMarkedAsDelivered),
          ),
        ),
      );
      if (linkSaved) {
        assignmentMarkedAsDelivered = true;
      }
    }

    this.submitting = false;

    if (successfulParts === 0) {
      this.submitError = firstErrorMessage || 'No se pudo enviar la entrega';
      return;
    }

    this.submitSuccess =
      firstErrorMessage
        ? 'Entrega registrada. Algunos elementos adicionales no se pudieron adjuntar.'
        : 'Entrega enviada correctamente.';
    this.clearSubmissionDraft(false);
    this.load();
  }

  isPending(item: StudentAssignmentListItem | null): boolean {
    return !!item && item.status === 'PENDIENTE';
  }

  private syncSelection(): void {
    if (!this.items.length) {
      this.selectedAssignment = null;
      this.selectedAssignmentId = '';
      return;
    }

    let nextSelection: StudentAssignmentListItem | undefined;

    if (this.selectedAssignmentId) {
      nextSelection = this.items.find((item) => item.id === this.selectedAssignmentId);
    }

    if (!nextSelection && this.selectedMilestoneId) {
      nextSelection = this.items.find((item) => item.milestone_id === this.selectedMilestoneId);
    }

    if (!nextSelection) {
      nextSelection = this.items[0];
    }

    const previousId = this.selectedAssignment?.id || '';
    this.selectedAssignment = nextSelection || null;
    this.selectedAssignmentId = nextSelection?.id || '';

    if (previousId && previousId !== this.selectedAssignmentId) {
      this.clearSubmissionDraft();
    }
  }

  private normalizeLink(value: string): string | null {
    const raw = (value || '').trim();
    if (!raw) return null;

    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(normalized);
      return parsed.toString();
    } catch {
      this.submitError = 'El enlace no es válido.';
      return null;
    }
  }

  private buildBaseEvidencePayload(
    assignment: StudentAssignmentListItem,
    assignmentMarkedAsDelivered: boolean,
  ): Pick<CreateEvidenceDto, 'projectId' | 'milestoneId' | 'title' | 'parentId' | 'assignmentId'> {
    return {
      projectId: this.courseId,
      milestoneId: assignment.milestone_id || undefined,
      title: assignment.milestone_title || 'Actividad',
      parentId: assignment.activity_folder_id || undefined,
      assignmentId: assignmentMarkedAsDelivered ? undefined : assignment.id,
    };
  }

  private buildTextEvidencePayload(
    assignment: StudentAssignmentListItem,
    text: string,
    assignmentMarkedAsDelivered: boolean,
  ): CreateEvidenceDto {
    const basePayload = this.buildBaseEvidencePayload(assignment, assignmentMarkedAsDelivered);
    return {
      ...basePayload,
      type: 'TEXT',
      content: text,
      description: text,
    };
  }

  private buildLinkEvidencePayload(
    assignment: StudentAssignmentListItem,
    link: string,
    assignmentMarkedAsDelivered: boolean,
  ): CreateEvidenceDto {
    const basePayload = this.buildBaseEvidencePayload(assignment, assignmentMarkedAsDelivered);
    return {
      ...basePayload,
      type: 'LINK',
      content: link,
      url: link,
    };
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (typeof error === 'string') return error;
    if (typeof error?.error === 'string') return error.error;
    if (typeof error?.error?.message === 'string') return error.error.message;
    if (typeof error?.message === 'string') return error.message;
    return fallback;
  }

  private focusSelectedMilestone(): void {
    if (!this.selectedMilestoneId) return;
    const targetId = `milestone-${this.selectedMilestoneId}`;
    setTimeout(() => {
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }
}
