import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssignmentsService } from '../../services/assignments';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <div class="topbar">
        <div class="brand">
          <div class="logo"></div>
          <div>
            <h1>Promanage</h1>
            <p>Panel Estudiante · Entregas</p>
          </div>
        </div>

        <span class="badge">Curso ID: {{ courseId }}</span>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Entregas del curso</h2>
            <p class="panel-subtitle">Selecciona un archivo y sube tu entrega.</p>
          </div>

          <button class="btn secondary" (click)="load()" [disabled]="loading">Actualizar</button>
        </div>

        <div class="panel-body">
          <div *ngIf="loading" class="toast">Cargando entregas...</div>
          <div *ngIf="!loading && assignments.length===0" class="toast">No hay tareas aún.</div>

          <div *ngIf="msg" class="toast ok">{{ msg }}</div>
          <div *ngIf="err" class="toast err">{{ err }}</div>

          <ul class="list" *ngIf="!loading && assignments.length>0">
            <li class="item" *ngFor="let a of assignments">
              <div style="flex:1;">
                <strong>{{ a.title }}</strong>
                <small>{{ a.description || 'Sin descripción' }}</small>
                <small>
                  Fecha límite:
                  <b>{{ a.dueDate ? (a.dueDate | date:'medium') : 'Sin fecha' }}</b>
                </small>

                <div class="row" style="margin-top:10px;">
                  <input type="file" (change)="onFileChange($event, a.id)" />
                  <button
                    class="btn small"
                    (click)="submit(a.id)"
                    [disabled]="loadingSubmit[a.id] || !selectedFiles[a.id]"
                  >
                    {{ loadingSubmit[a.id] ? 'Subiendo...' : 'Subir entrega' }}
                  </button>

                  <span class="badge" *ngIf="selectedFiles[a.id]">
                    {{ selectedFiles[a.id]?.name }}
                  </span>
                </div>
              </div>
            </li>
          </ul>

          <hr class="sep" />
          <button class="btn secondary" (click)="goBack()">← Volver</button>
        </div>
      </div>
    </div>
  `,
})
export class StudentAssignmentsPage implements OnInit {
  courseId!: number;
  assignments: any[] = [];
  loading = false;

  selectedFiles: Record<number, File | null> = {};
  loadingSubmit: Record<number, boolean> = {};

  msg = '';
  err = '';

  private assignmentsService = new AssignmentsService();

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    await this.load();
  }

  async load() {
    this.msg = '';
    this.err = '';
    try {
      this.loading = true;
      this.assignments = await this.assignmentsService.getAssignmentsByCourse(this.courseId);
    } catch (e: any) {
      this.err = e?.message || 'Error al cargar entregas';
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  onFileChange(event: any, assignmentId: number) {
    const file = event?.target?.files?.[0] || null;
    this.selectedFiles[assignmentId] = file;
  }

  async submit(assignmentId: number) {
    this.msg = '';
    this.err = '';
    try {
      const file = this.selectedFiles[assignmentId];
      if (!file) {
        this.err = 'Selecciona un archivo';
        return;
      }

      this.loadingSubmit[assignmentId] = true;
      await this.assignmentsService.submitAssignment(assignmentId, file);

      this.msg = 'Entrega subida ✅';
      this.selectedFiles[assignmentId] = null;
    } catch (e: any) {
      this.err = e?.message || 'No se pudo subir la entrega';
      console.error(e);
    } finally {
      this.loadingSubmit[assignmentId] = false;
    }
  }

  goBack() {
    history.back();
  }
}
