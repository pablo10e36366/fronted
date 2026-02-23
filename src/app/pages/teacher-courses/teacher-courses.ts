import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="topbar">
        <div class="brand">
          <div class="logo"></div>
          <div>
            <h1>Promanage</h1>
            <p>Panel Docente · Crear y administrar cursos</p>
          </div>
        </div>

        <span class="badge">Ruta: /teacher/courses</span>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Mis Cursos (Docente)</h2>
            <p class="panel-subtitle">Crea cursos y comparte el código con tus estudiantes.</p>
          </div>
          <button class="btn secondary" (click)="load()" [disabled]="loading">Actualizar</button>
        </div>

        <div class="panel-body grid">
          <div class="card">
            <strong>Crear curso</strong>
            <hr class="sep" />

            <div class="row">
              <input class="input" [(ngModel)]="name" placeholder="Nombre del curso" />
              <input class="input" [(ngModel)]="description" placeholder="Descripción (opcional)" />
              <button class="btn" (click)="create()" [disabled]="loading">Crear</button>
            </div>

            <div *ngIf="msg" class="toast ok">{{ msg }}</div>
            <div *ngIf="err" class="toast err">{{ err }}</div>

            <div *ngIf="roleWarning" class="toast err">
              ⚠️ Estás logueado como <b>{{ roleWarning }}</b>. Para crear cursos necesitas rol <b>docente</b>.
            </div>
          </div>

          <div class="card">
            <strong>Estado</strong>
            <hr class="sep" />
            <div class="toast" *ngIf="loading">Cargando...</div>
            <div class="toast" *ngIf="!loading && courses.length===0">Aún no tienes cursos.</div>
            <div class="toast" *ngIf="!loading && courses.length>0">
              Cursos creados: <b>{{ courses.length }}</b>
            </div>
          </div>
        </div>

        <div class="panel-body">
          <h3 style="margin-top:0;">Lista de cursos</h3>

          <ul class="list" *ngIf="!loading">
            <li class="item" *ngFor="let c of courses">
              <div>
                <strong>{{ c.name }}</strong>
                <small>{{ c.description || 'Sin descripción' }}</small>
                <small>Código: <b>{{ c.code }}</b></small>
              </div>

              <span class="badge">Compartir código</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class TeacherCoursesPage implements OnInit {
  courses: any[] = [];
  loading = false;

  name = '';
  description = '';

  msg = '';
  err = '';
  roleWarning: string | null = null;

  constructor(private coursesService: CoursesService, private auth: AuthService) {}

  async ngOnInit() {
    // ✅ Si entras con token de estudiante te dará 403. Aquí te aviso bonito.
    const role = this.auth.getRole();
    if (role && role !== 'docente') this.roleWarning = role;

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

  async create() {
    this.msg = '';
    this.err = '';
    try {
      const name = this.name.trim();
      const description = this.description.trim();

      if (!name) {
        this.err = 'Ingresa el nombre del curso';
        return;
      }

      await this.coursesService.createCourse({
        name,
        description: description || undefined,
      });

      this.name = '';
      this.description = '';
      await this.load();

      this.msg = 'Curso creado correctamente ✅';
    } catch (e: any) {
      this.err = e?.message || 'No se pudo crear el curso';
      console.error(e);
    }
  }
}
