import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg">
      <div class="container">
        <!-- TOPBAR -->
        <div class="topbar">
          <div class="brand">
            <div class="logo"></div>
            <div>
              <h1>Promanage</h1>
              <p>Panel Estudiante · Cursos y entregas</p>
            </div>
          </div>

          <div class="top-actions">
            <button class="chip" (click)="goCommunity()">Comunidad</button>
            <button class="chip active" (click)="goStudent()">Mis cursos</button>
            <button class="chip danger" (click)="logout()">Salir</button>
          </div>
        </div>

        <!-- PANEL -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Mis Cursos (Estudiante)</h2>
              <p class="panel-subtitle">Únete con código y revisa tus entregas.</p>
            </div>

            <span class="badge">Ruta: /student/courses</span>
          </div>

          <div class="panel-body grid">
            <div class="card">
              <strong>Unirme a un curso</strong>
              <hr class="sep" />

              <div class="row">
                <input
                  class="input"
                  [(ngModel)]="code"
                  placeholder="Código del curso (ej: HC5BSZ)"
                />
                <button class="btn" (click)="join()" [disabled]="loading">Unirme</button>
                <button class="btn secondary" (click)="load()" [disabled]="loading">
                  Actualizar
                </button>
              </div>

              <div *ngIf="msg" class="toast ok">{{ msg }}</div>
              <div *ngIf="err" class="toast err">{{ err }}</div>
            </div>

            <div class="card">
              <strong>Estado</strong>
              <hr class="sep" />
              <div class="toast" *ngIf="loading">Cargando cursos...</div>
              <div class="toast" *ngIf="!loading && courses.length===0">Aún no tienes cursos.</div>
              <div class="toast" *ngIf="!loading && courses.length>0">
                Cursos encontrados: <b>{{ courses.length }}</b>
              </div>
            </div>
          </div>

          <div class="panel-body">
            <h3 style="margin-top:0;">Lista de cursos</h3>

            <ul class="list" *ngIf="!loading">
              <li class="item" *ngFor="let c of courses">
                <div class="course-info">
                  <strong>{{ c.name }}</strong>
                  <small>{{ c.description || 'Sin descripción' }}</small>
                  <small>Código: <b>{{ c.code }}</b></small>
                </div>

                <div class="row">
                  <a
                    class="btn secondary small"
                    [routerLink]="['/student/courses', c.id, 'assignments']"
                  >
                    Ver entregas
                  </a>
                </div>
              </li>
            </ul>

            <div class="hint" *ngIf="!loading && courses.length===0">
              Tip: pídele al docente el <b>código</b> del curso y pégalo arriba para unirte 😉
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bg {
        min-height: 100vh;
        background: radial-gradient(1200px 600px at 30% 10%, #1f3b77 0%, #0b1220 55%, #070b14 100%);
        padding: 28px 18px;
        color: #eaf0ff;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }

      .container {
        max-width: 1050px;
        margin: 0 auto;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, #33a3ff, #6d5bff);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
      }

      .brand h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.2px;
      }

      .brand p {
        margin: 2px 0 0;
        font-size: 12px;
        opacity: 0.8;
      }

      .top-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .chip {
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.06);
        color: #eaf0ff;
        padding: 10px 14px;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 650;
        transition: 0.15s ease;
      }
      .chip:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.09);
      }
      .chip.active {
        border-color: rgba(51, 163, 255, 0.55);
        background: rgba(51, 163, 255, 0.14);
      }
      .chip.danger {
        border-color: rgba(255, 92, 92, 0.4);
        background: rgba(255, 92, 92, 0.12);
      }

      .panel {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(10px);
      }

      .panel-header {
        padding: 18px 18px 12px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .panel-title {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
      }

      .panel-subtitle {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: 0.8;
      }

      .badge {
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        white-space: nowrap;
        opacity: 0.95;
      }

      .panel-body {
        padding: 16px 18px 18px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: rgba(0, 0, 0, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 14px;
      }

      .sep {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        margin: 10px 0 12px;
      }

      .row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }

      .input {
        flex: 1;
        min-width: 220px;
        padding: 11px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.06);
        color: #eaf0ff;
        outline: none;
      }

      .btn {
        padding: 11px 14px;
        border-radius: 12px;
        border: 1px solid rgba(51, 163, 255, 0.55);
        background: rgba(51, 163, 255, 0.18);
        color: #eaf0ff;
        cursor: pointer;
        font-weight: 750;
      }

      .btn:hover {
        background: rgba(51, 163, 255, 0.24);
      }

      .btn.secondary {
        border-color: rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.08);
      }

      .btn.secondary:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      .btn.small {
        padding: 9px 12px;
        font-size: 13px;
      }

      .btn:disabled,
      .chip:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
      }

      .toast {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.07);
        font-size: 13px;
      }

      .toast.ok {
        border-color: rgba(60, 255, 170, 0.25);
        background: rgba(60, 255, 170, 0.09);
      }

      .toast.err {
        border-color: rgba(255, 92, 92, 0.25);
        background: rgba(255, 92, 92, 0.09);
      }

      .list {
        list-style: none;
        padding: 0;
        margin: 10px 0 0;
        display: grid;
        gap: 10px;
      }

      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.12);
      }

      .course-info {
        display: grid;
        gap: 4px;
      }

      small {
        opacity: 0.85;
      }

      .hint {
        margin-top: 14px;
        opacity: 0.85;
        font-size: 13px;
      }
    `,
  ],
})
export class StudentCoursesPage implements OnInit {
  courses: any[] = [];
  loading = false;
  code = '';

  msg = '';
  err = '';

  constructor(
    private coursesService: CoursesService,
    private router: Router,
    private auth: AuthService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.msg = '';
    this.err = '';
    try {
      this.loading = true;
      this.courses = await this.coursesService.myCourses();
    } catch (e: any) {
      this.err = e?.message || 'Error al cargar cursos';
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  async join() {
    this.msg = '';
    this.err = '';
    try {
      const code = this.code.trim();
      if (!code) {
        this.err = 'Ingresa el código del curso';
        return;
      }

      await this.coursesService.joinCourse(code);
      this.code = '';
      await this.load();

      this.msg = 'Te uniste correctamente ✅';
    } catch (e: any) {
      this.err = e?.message || 'No se pudo unir al curso';
      console.error(e);
    }
  }

  // ✅ NAV
  goCommunity() {
    this.router.navigateByUrl('/projects');
  }

  goStudent() {
    this.router.navigateByUrl('/student/courses');
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
