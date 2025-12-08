import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../services/project';

@Component({
  standalone: true,
  selector: 'app-projects',
  templateUrl: './projects.html',
  styleUrl: './projects.css',
  imports: [CommonModule, FormsModule],
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];

  title = '';
  description = '';
  selectedFile: File | null = null;

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private projectsService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectsService.getMyProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: () => {
        this.errorMessage = 'Error al cargar proyectos';
      },
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    this.selectedFile = file ?? null;
  }

  onSubmit(): void {
    if (!this.selectedFile || !this.title.trim()) {
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

          // Recargar lista
          this.loadProjects();
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Error al subir el proyecto';
        },
      });
  }

  downloadProject(id: number): void {
    this.projectsService.downloadProjectFile(id);
  }
}
