import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ProjectsComponent } from './pages/projects/projects';
import { authGuard } from './guards/auth-guard';   // 👈 AQUI VA EL IMPORT NUEVO

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'projects',
    component: ProjectsComponent,
    canActivate: [authGuard],   // 👈 Protegemos la ruta
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
];