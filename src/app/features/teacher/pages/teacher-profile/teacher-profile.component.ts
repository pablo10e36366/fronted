import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { SessionService } from '../../../../core/auth/data-access/session.service';
import type { JwtUserPayload } from '../../../../core/models/auth.models';
import type { StudentRoleUpgradeRequest } from '../../../../core/models/student.models';
import { StudentService } from '../../../student/data-access/student.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-profile.component.html',
  styleUrls: ['./teacher-profile.component.css'],
})
export class TeacherProfileComponent implements OnInit, OnDestroy {
  user$: Observable<JwtUserPayload | null>;
  private userSub?: Subscription;

  teacherRequest: StudentRoleUpgradeRequest | null = null;
  teacherRequestMessage = '';
  teacherRequestLoading = false;
  teacherRequestSubmitting = false;
  teacherRequestSuccess = '';
  teacherRequestError = '';
  private currentRole = '';

  constructor(
    private readonly sessionService: SessionService,
    private readonly studentService: StudentService,
  ) {
    this.user$ = this.sessionService.currentUser$;
  }

  ngOnInit(): void {
    this.userSub = this.user$.subscribe((user) => {
      this.currentRole = String(user?.role || '').toLowerCase();
      if (this.currentRole === 'colaborador') {
        this.loadTeacherRequest();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  logout(): void {
    this.sessionService.logout();
  }

  get isStudentRole(): boolean {
    return this.currentRole === 'colaborador';
  }

  canSubmitTeacherRequest(): boolean {
    if (!this.isStudentRole) return false;
    if (this.teacherRequestSubmitting) return false;
    return this.teacherRequest?.status !== 'PENDING' && this.teacherRequest?.status !== 'APPROVED';
  }

  submitTeacherRequest(): void {
    if (!this.canSubmitTeacherRequest()) return;

    this.teacherRequestSubmitting = true;
    this.teacherRequestSuccess = '';
    this.teacherRequestError = '';

    this.studentService.createTeacherRoleRequest(this.teacherRequestMessage).subscribe({
      next: (res) => {
        this.teacherRequest = res.data?.request || null;
        this.teacherRequestSubmitting = false;
        this.teacherRequestMessage = '';
        this.teacherRequestSuccess = 'Solicitud enviada al administrador.';
      },
      error: (err: unknown) => {
        this.teacherRequestSubmitting = false;
        this.teacherRequestError = this.toErrorMessage(err);
      },
    });
  }

  teacherRequestStatusLabel(status?: string | null): string {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'PENDING') return 'Pendiente';
    if (normalized === 'APPROVED') return 'Aprobada';
    if (normalized === 'REJECTED') return 'Rechazada';
    return 'Sin solicitud';
  }

  teacherRequestStatusClass(status?: string | null): string {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'PENDING') return 'status-pending';
    if (normalized === 'APPROVED') return 'status-approved';
    if (normalized === 'REJECTED') return 'status-rejected';
    return 'status-empty';
  }

  displayRole(role?: string | null): string {
    const normalized = String(role || '').toLowerCase();
    if (!normalized) return '-';
    if (normalized === 'docente') return 'Docente';
    if (normalized === 'colaborador') return 'Estudiante';
    if (normalized === 'admin') return 'Admin';
    return normalized;
  }

  roleClass(role?: string | null): string {
    const normalized = String(role || '').toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'docente') return 'teacher';
    return 'student';
  }

  initials(name?: string | null): string {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private loadTeacherRequest(): void {
    this.teacherRequestLoading = true;
    this.teacherRequestError = '';

    this.studentService.getTeacherRoleRequest().subscribe({
      next: (res) => {
        this.teacherRequest = res.data?.request || null;
        this.teacherRequestLoading = false;
      },
      error: (err: unknown) => {
        this.teacherRequestLoading = false;
        this.teacherRequestError = this.toErrorMessage(err);
      },
    });
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message =
        (typeof err.error?.message === 'string' && err.error.message) ||
        (typeof err.error?.error?.message === 'string' && err.error.error.message);
      return message || 'No se pudo procesar la solicitud.';
    }
    return 'No se pudo procesar la solicitud.';
  }
}
