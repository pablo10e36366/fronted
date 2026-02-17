import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseCardComponent, Course } from '../../../../components/course-card/course-card.component';
import { TeacherService } from '../../data-access/teacher.service';
import type { TeacherCourse } from '../../../../core/models/teacher.models';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, CourseCardComponent],
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.css']
})
export class TeacherCoursesComponent implements OnInit {
  courses: Course[] = [];
  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 10;
  total = 0;

  showCreateModal = false;
  newTitle = '';
  newDescription = '';
  creating = false;

  showDeleteModal = false;
  deleting = false;
  deleteErrorMessage = '';
  courseToDelete: Course | null = null;

  constructor(private teacherService: TeacherService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  openCreateModal(): void {
    this.errorMessage = '';
    this.newTitle = '';
    this.newDescription = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    if (this.creating) return;
    this.showCreateModal = false;
  }

  createCourse(): void {
    const title = this.newTitle.trim();
    if (!title) {
      this.errorMessage = 'El título es obligatorio';
      return;
    }

    this.creating = true;
    this.errorMessage = '';

    this.teacherService.createCourse({ name: title, description: this.newDescription || null }).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.loadCourses();
      },
      error: (err: any) => {
        this.creating = false;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'No se pudo crear el curso');
      },
    });
  }

  requestDeleteCourse(courseId: string): void {
    const found = this.courses.find((c) => c.id === courseId) || null;
    if (!found) return;
    this.errorMessage = '';
    this.deleteErrorMessage = '';
    this.courseToDelete = found;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
    this.courseToDelete = null;
    this.deleteErrorMessage = '';
  }

  confirmDeleteCourse(): void {
    const id = this.courseToDelete?.id;
    if (!id) return;

    this.deleting = true;
    this.deleteErrorMessage = '';
    this.teacherService.deleteCourse(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.courseToDelete = null;
        // If we deleted the last course on the current page, go back one page.
        if (this.courses.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.loadCourses();
      },
      error: (err: any) => {
        this.deleting = false;
        const msg = (typeof err === 'string') ? err : (err?.message || 'No se pudo eliminar el curso');
        this.deleteErrorMessage = msg;
        this.errorMessage = msg;
      },
    });
  }

  private loadCourses(): void {
    this.loading = true;
    this.errorMessage = '';
    this.teacherService.getCourses({ page: this.page, page_size: this.pageSize }).subscribe({
      next: (res) => {
        const items = res?.data?.items || [];
        this.total = res?.meta?.total || items.length;
        this.courses = items.map((c) => this.mapTeacherCourseToCourse(c));
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.total = 0;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'No se pudieron cargar los cursos');
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

  private mapTeacherCourseToCourse(course: TeacherCourse): Course {
    const title = course.name || 'Curso';
    return {
      id: course.id,
      title,
      code: course.code,
      thumbnail: null,
      students_count: course.students_count || 0,
      pending_submissions_count: course.pending_submissions_count || 0,
      unanswered_threads_count: course.unanswered_threads_count || 0,
      last_activity_at: course.last_activity_at,
    };
  }
}
