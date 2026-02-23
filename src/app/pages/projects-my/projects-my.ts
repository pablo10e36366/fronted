import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-projects-my',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:20px;">
      <h2>Mis Proyectos</h2>

      <p *ngIf="loading">Cargando...</p>
      <p *ngIf="!loading && errorMsg" style="color:red">{{ errorMsg }}</p>

      <div *ngFor="let p of projects" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;">
        <h3>{{ p.title }}</h3>
        <p>{{ p.description }}</p>

        <a
          [href]="'http://localhost:3000/api/projects/' + p.id + '/download'"
          target="_blank"
        >
          Descargar proyecto
        </a>
      </div>
    </div>
  `,
})
export class ProjectsMyComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  errorMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // ✅ si no hay token, NO llamamos al backend (evita 401)
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('token')
        : null;

    if (!token) {
      this.errorMsg = 'No hay sesión activa. Inicia sesión.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.http.get<any>('http://localhost:3000/api/projects/me').subscribe({
      next: (res) => {
        this.projects = res.items || [];
        this.loading = false;
      },
      error: () => {
        // ✅ NO spamear consola con rojo
        this.loading = false;
        this.errorMsg = 'No se pudo cargar. Vuelve a iniciar sesión.';
      },
    });
  }
}
