import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { CourseCardComponent, Course } from '../../../../components/course-card/course-card.component';
import { StudentService } from '../../data-access/student.service';
import type { StudentAvailableCourse, StudentCourse } from '../../../../core/models/student.models';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, CourseCardComponent],
  templateUrl: './student-courses.component.html',
  styleUrls: ['./student-courses.component.css'],
})
export class StudentCoursesComponent implements OnInit {
  courses: Course[] = [];
  availableCourses: Course[] = [];
  loading = false;
  errorMessage = '';
  infoMessage = '';

  page = 1;
  pageSize = 10;
  total = 0;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadAvailableCourses();
  }

  private loadCourses(): void {
    this.loading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.studentService.getCourses({ page: this.page, page_size: this.pageSize }).subscribe({
      next: (res) => {
        const items = res?.data?.items || [];
        this.total = res?.meta?.total || items.length;
        this.courses = items.map((c) => this.mapStudentCourseToCourse(c));
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.total = 0;
        this.courses = [];
        this.errorMessage =
          typeof err === 'string' ? err : err?.message || 'No se pudieron cargar tus cursos';
      },
    });
  }

  private loadAvailableCourses(): void {
    this.studentService.getAvailableCourses({ page: 1, page_size: 20 }).subscribe({
      next: (res) => {
        const items = res?.data?.items || [];
        this.availableCourses = items.map((c) => this.mapAvailableCourseToCourse(c));
      },
      error: () => {
        // No bloquear la pantalla si falla el listado de disponibles.
        this.availableCourses = [];
      },
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  goToPage(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.totalPages));
    if (nextPage === this.page) return;
    this.page = nextPage;
    this.loadCourses();
  }

  private mapStudentCourseToCourse(course: StudentCourse): Course {
    const title = course.name || 'Curso';
    return {
      id: course.id,
      title,
      code: course.code || '----',
      thumbnail: null,
      students_count: course.students_count || 0,
      pending_submissions_count: course.pending_assignments_count || 0,
      unanswered_threads_count: 0,
      last_activity_at: course.last_activity_at,
    };
  }

  private mapAvailableCourseToCourse(course: StudentAvailableCourse): Course {
    const title = course.name || 'Curso';
    return {
      id: course.id,
      title,
      code: course.code || '----',
      thumbnail: null,
      students_count: course.students_count || 0,
      pending_submissions_count: 0,
      unanswered_threads_count: 0,
      last_activity_at: course.last_activity_at,
      join_status: course.join_status,
    };
  }

  requestJoin(courseId: string): void {
    this.errorMessage = '';
    this.infoMessage = '';

    this.studentService.joinCourse(courseId).subscribe({
      next: (res) => {
        const status = res?.data?.join_status || 'PENDING';
        this.infoMessage =
          status === 'PENDING'
            ? 'Solicitud enviada. Espera la aprobación del docente.'
            : 'Solicitud procesada.';
        this.loadCourses();
        this.loadAvailableCourses();
      },
      error: (err: any) => {
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          'No se pudo enviar la solicitud. Intenta de nuevo.';
        this.loadAvailableCourses();
      },
    });
  }
}
