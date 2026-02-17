import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Course {
  id: string;
  title: string;
  code: string;
  thumbnail?: string | null;
  students_count: number;
  pending_submissions_count: number;
  unanswered_threads_count: number;
  last_activity_at: string | null;
  join_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | null;
}

export type CourseCardVariant = 'default' | 'available';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.css']
})
export class CourseCardComponent {
  @Input() course: Course | null = null;
  @Input() variant: CourseCardVariant = 'default';
  @Input() showOpenCourse = true;
  @Input() canDelete = false;
  @Output() joinCourse = new EventEmitter<string>();
  @Output() deleteCourse = new EventEmitter<string>();

  get joinLabel(): string {
    const status = this.course?.join_status ?? null;
    if (status === 'PENDING') return 'Solicitud enviada';
    if (status === 'APPROVED') return 'Ya inscrito';
    if (status === 'REJECTED') return 'Solicitar de nuevo';
    if (status === 'REVOKED') return 'Solicitar acceso';
    return 'Unirme';
  }

  get joinDisabled(): boolean {
    const status = this.course?.join_status ?? null;
    return status === 'PENDING' || status === 'APPROVED';
  }

  onJoinClick(): void {
    const id = this.course?.id;
    if (!id) return;
    if (this.joinDisabled) return;
    this.joinCourse.emit(id);
  }

  onDeleteClick(): void {
    const id = this.course?.id;
    if (!id) return;
    this.deleteCourse.emit(id);
  }

  get thumbnailSrc(): string {
    const provided = (this.course?.thumbnail || '').trim();
    if (provided) return provided;

    const title = (this.course?.title || 'Curso').trim();
    const label = this.getShortLabel(title);
    return this.buildSvgThumbnail(label);
  }

  private getShortLabel(title: string): string {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'CUR';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase().padEnd(2, ' ');
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  private buildSvgThumbnail(label: string): string {
    const safeText = (label || 'CUR').slice(0, 3).toUpperCase();
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="90" viewBox="0 0 140 90">
  <rect width="140" height="90" rx="14" fill="#2F5BEA"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        font-size="36" font-weight="700" fill="#FFFFFF">${safeText}</text>
</svg>`.trim();

    const base64 = this.toBase64(svg);
    if (base64) return `data:image/svg+xml;base64,${base64}`;

    // Fallback (should be rare): URL-encoded SVG.
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private toBase64(value: string): string {
    // Browser path
    if (typeof btoa === 'function') {
      // btoa requires Latin1; encodeURIComponent handles UTF-8.
      return btoa(unescape(encodeURIComponent(value)));
    }

    // SSR / Node path
    const bufferCtor = (globalThis as any)?.Buffer;
    if (bufferCtor?.from) {
      return bufferCtor.from(value, 'utf8').toString('base64');
    }

    return '';
  }
}
