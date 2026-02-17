import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import type { JwtUserPayload } from '../../../../core/models/auth.models';
import { SessionService } from '../../../../core/auth/data-access/session.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-profile.component.html',
  styleUrls: ['./teacher-profile.component.css'],
})
export class TeacherProfileComponent {
  user$: Observable<JwtUserPayload | null>;

  constructor(private sessionService: SessionService) {
    this.user$ = this.sessionService.currentUser$;
  }

  logout(): void {
    this.sessionService.logout();
  }

  displayRole(role?: string | null): string {
    const normalized = String(role || '').toLowerCase();
    if (!normalized) return '—';
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
}
