import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginPage),
  },

  // ✅ Comunidad (Proyectos)
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/projects/projects').then((m) => m.ProjectsPage),
  },

  // ✅ Mis proyectos
  {
    path: 'projects/my',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/projects-my/projects-my').then(
        (m) => m.ProjectsMyComponent,
      ),
  },

  // ✅ Estudiante
  {
    path: 'student/courses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/student-courses/student-courses').then(
        (m) => m.StudentCoursesPage,
      ),
  },

  // ✅ Entregas estudiante
  {
    path: 'student/courses/:courseId/assignments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/student-assignments/student-assignments').then(
        (m) => m.StudentAssignmentsPage,
      ),
  },

  // ✅ Docente
  {
    path: 'teacher/courses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/teacher-courses/teacher-courses').then(
        (m) => m.TeacherCoursesPage,
      ),
  },

  { path: '**', redirectTo: 'login' },
];
