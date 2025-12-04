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

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getMyProjects().subscribe({
      next: (data) => {
        this.projects = data;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error al cargar los proyectos';
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadProject() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedFile) {
      this.errorMessage = 'Selecciona un archivo primero';
      return;
    }

    this.loading = true;

    this.projectService
      .uploadProject(this.title, this.description, this.selectedFile)
      .subscribe({
        next: (project) => {
          this.loading = false;
          this.successMessage = 'Proyecto subido correctamente';

          // limpiar formulario
          this.title = '';
          this.description = '';
          this.selectedFile = null;

          // agregar el proyecto nuevo al inicio de la tabla
          this.projects.unshift(project);
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.errorMessage = 'Error al subir el proyecto';
        },
      });
  }

  downloadProject(id: number) {
    this.projectService.downloadProjectFile(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyecto-${id}`; // puedes cambiar el nombre si tu backend manda filename
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        alert('Error al descargar el archivo');
      },
    });
  }
}
