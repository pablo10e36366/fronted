import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <h2>Login</h2>

    <div style="max-width:420px;padding:10px;border:1px solid #ddd;">
      <input [(ngModel)]="email" placeholder="Email" style="width:100%;margin-bottom:8px;" />
      <input [(ngModel)]="password" type="password" placeholder="Contraseña" style="width:100%;margin-bottom:8px;" />

      <button (click)="login()" [disabled]="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <p *ngIf="err" style="color:red">{{ err }}</p>
    </div>
  `,
})
export class LoginPage {

  email = '';
  password = '';
  loading = false;
  err = '';

  constructor(private auth: AuthService, private router: Router) {}

  async login() {

    this.err = '';

    const email = this.email.trim();
    const password = this.password.trim();

    if (!email || !password) {
      this.err = 'Completa email y contraseña';
      return;
    }

    try {
      this.loading = true;

      await firstValueFrom(this.auth.login(email, password));

      const role = (this.auth.getRole() || '').toLowerCase();

      if (role === 'docente') {
        this.router.navigateByUrl('/teacher/courses');
      }
      else if (role === 'estudiante') {
        this.router.navigateByUrl('/student/courses');
      }
      else if (role === 'administrador' || role === 'admin') {
        this.router.navigateByUrl('/projects');
      }
      else {
        this.router.navigateByUrl('/projects');
      }

    } catch (e:any) {
      this.err = e?.error?.message || 'Error login';
    } finally {
      this.loading = false;
    }
  }
}
