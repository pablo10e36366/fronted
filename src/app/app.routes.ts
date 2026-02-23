import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { RegisterVerifyComponent } from './pages/register-verify/register-verify';
import { ProjectsComponent } from './pages/projects/projects';
import { AdminComponent } from './pages/admin/admin';
import { AdminNotificationsPageComponent } from './pages/admin/admin-notifications-page';
import { RepositoryComponent } from './pages/repository/repository';
import { EvidenceDetailComponent } from './pages/evidence-detail/evidence-detail';
import { FoldersComponent } from './pages/folders/folders';
import { MiEspacioComponent } from './pages/mi-espacio/mi-espacio';
import { FeedComponent } from './pages/feed/feed';
import { GodModeComponent } from './pages/god-mode/god-mode';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { LayoutComponent } from './components/layout/layout';
import { SettingsComponent } from './pages/settings/settings';
import { RemindersComponent } from './pages/reminders/reminders';
import { TeacherLayoutComponent } from './layouts/teacher-layout/teacher-layout.component';
import { TeacherCoursesComponent } from './features/teacher/pages/teacher-courses/teacher-courses.component';
import { docenteMatchGuard } from './guards/docente-match-guard';
import { TeacherDeliveriesComponent } from './features/teacher/pages/teacher-deliveries/teacher-deliveries.component';
import { TeacherActivitiesComponent } from './features/teacher/pages/teacher-activities/teacher-activities.component';
import { TeacherDashboardComponent } from './features/teacher/pages/teacher-dashboard/teacher-dashboard.component';
import { TeacherProfileComponent } from './features/teacher/pages/teacher-profile/teacher-profile.component';
import { TeacherNotificationsComponent } from './features/teacher/pages/teacher-notifications/teacher-notifications.component';
import { colaboradorMatchGuard } from './guards/colaborador-match-guard';
import { StudentCoursesComponent } from './features/student/pages/student-courses/student-courses.component';
import { StudentDeliveriesComponent } from './features/student/pages/student-deliveries/student-deliveries.component';
import { StudentDashboardComponent } from './features/student/pages/student-dashboard/student-dashboard.component';
import { StudentActivitiesComponent } from './features/student/pages/student-activities/student-activities.component';
import { StudentNotificationsComponent } from './features/student/pages/student-notifications/student-notifications.component';
import { StudentGradesComponent } from './features/student/pages/student-grades/student-grades.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'register/verify', component: RegisterVerifyComponent },

  {
    path: '',
    component: TeacherLayoutComponent,
    canMatch: [docenteMatchGuard],
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: TeacherDashboardComponent },
      { path: '', component: TeacherCoursesComponent },
      { path: 'entregas', component: TeacherDeliveriesComponent },
      { path: 'entregas/:courseId', component: TeacherDeliveriesComponent },
      { path: 'actividades', redirectTo: '', pathMatch: 'full' },
      { path: 'actividades/:courseId', component: TeacherActivitiesComponent },
      { path: 'perfil', component: TeacherProfileComponent },
      { path: 'notificaciones', component: TeacherNotificationsComponent },
      { path: 'projects/:id', component: RepositoryComponent },
      { path: 'projects/:projectId/evidence/:evidenceId', component: EvidenceDetailComponent },
      { path: '**', redirectTo: '' },
    ],
  },

  {
    path: '',
    component: TeacherLayoutComponent,
    canMatch: [colaboradorMatchGuard],
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: StudentDashboardComponent },
      { path: '', component: StudentCoursesComponent },
      { path: 'entregas', component: StudentDeliveriesComponent },
      { path: 'entregas/:courseId', component: StudentDeliveriesComponent },
      { path: 'actividades', redirectTo: '', pathMatch: 'full' },
      { path: 'actividades/:courseId', component: StudentActivitiesComponent },
      { path: 'calificaciones', component: StudentGradesComponent },
      { path: 'perfil', component: TeacherProfileComponent },
      { path: 'notificaciones', component: StudentNotificationsComponent },
      { path: 'projects/:id', component: RepositoryComponent },
      { path: 'projects/:projectId/evidence/:evidenceId', component: EvidenceDetailComponent },
      { path: '**', redirectTo: '' },
    ],
  },

  {
    path: 'teacher',
    component: TeacherLayoutComponent,
    // Protegemos la ruta con authGuard y roleGuard para que sÃ³lo usuarios con
    // el rol esperado (docente) puedan acceder.
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'docente' },
    children: [
      { path: 'courses', component: TeacherCoursesComponent },
      { path: '', redirectTo: 'courses', pathMatch: 'full' }
    ]
  },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'projects',
        component: ProjectsComponent
      },
      {
        path: 'projects/:id',
        component: RepositoryComponent,
      },
      {
        path: 'projects/:projectId/evidence/:evidenceId',
        component: EvidenceDetailComponent,
      },
      {
        path: 'folders',
        component: FoldersComponent,
      },
      // Timeline eliminado: mantenemos compatibilidad por URL antigua.
      { path: 'timeline', redirectTo: 'projects', pathMatch: 'full' },
      {
        path: 'mi-espacio',
        component: MiEspacioComponent,
      },
      {
        path: 'feed',
        component: FeedComponent,
        canActivate: [roleGuard],
        data: { excludedRoles: ['docente'] }
      },
      {
        path: 'god-mode',
        component: GodModeComponent,
        canActivate: [roleGuard],
        data: { expectedRole: 'admin' }
      },
      {
        path: 'admin/notifications',
        component: AdminNotificationsPageComponent,
        canActivate: [roleGuard],
        data: { expectedRole: 'admin' }
      },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [roleGuard],
        data: { expectedRole: 'admin' }
      },
      {
        path: 'settings',
        component: SettingsComponent
      },
      {
        path: 'reminders',
        component: RemindersComponent
      },
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
    ]
  },

  // Fallback si no logueado
  { path: '**', redirectTo: 'login' }
];

