import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProjectService } from '../../services/project';
import { ProjectDto } from '../../core/models/project.models';

@Component({
  standalone: true,
  selector: 'app-projects',
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  imports: [CommonModule, FormsModule],
})
export class ProjectsComponent implements OnInit {
  // 🔹 LISTA DE PROYECTOS (TIPADA)
  projects: ProjectDto[] = [];

  // 🔹 FORMULARIO
  title = '';
  description = '';
  selectedFile: File | null = null;

  // 🔹 ESTADOS UI
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private projectsService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  // 🔹 CARGAR PROYECTOS
  loadProjects(): void {
    this.projectsService.getMyProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Error al cargar proyectos';
      },
    });
  }

  // 🔹 CAMBIO DE ARCHIVO
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  // 🔹 SUBIR PROYECTO
  onSubmit(): void {
    if (!this.title.trim() || !this.selectedFile) {
      this.errorMessage = 'Título y archivo son obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.projectsService
      .uploadProject(this.title, this.description, this.selectedFile)
      .subscribe({
        next: () => {
          this.successMessage = 'Proyecto subido correctamente';
          this.title = '';
          this.description = '';
          this.selectedFile = null;
          this.loading = false;
          this.loadProjects(); // recargar lista
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message || 'Error al subir el proyecto';
        },
      });
  }

  // 🔹 DESCARGAR ARCHIVO
  downloadProject(projectId: number): void {
    this.projectsService.downloadProjectFile(projectId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archivo';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Error al descargar el archivo';
      },
    });
  }
}
