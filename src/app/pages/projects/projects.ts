import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project';
import { ProjectDto } from '../../core/models/project.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrls: ['./projects.css'],
})
export class ProjectsPage implements OnInit {
  projects: ProjectDto[] = [];
  loading = false;

  // ✅ Buscar
  search = '';

  // ✅ Subida
  title = '';
  description = '';
  selectedFile: File | null = null;

  // ✅ Editar
  editingId: number | null = null;
  editTitle = '';
  editDescription = '';
  editStatus = 'activo';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  // ✅ Alert seguro (evita error SSR: alert is not defined)
  private safeAlert(msg: string) {
    if (typeof window !== 'undefined') window.alert(msg);
  }

  loadProjects(): void {
    this.loading = true;

    this.projectService.getMyProjects(this.search).subscribe({
      next: (data) => {
        this.projects = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.safeAlert('Error cargando proyectos');
      },
    });
  }

  onSearch(): void {
    this.loadProjects();
  }

  clearSearch(): void {
    this.search = '';
    this.loadProjects();
  }

  onFileChange(event: any): void {
    const file = event?.target?.files?.[0];
    this.selectedFile = file ?? null;
  }

  upload(): void {
    if (!this.title.trim()) return this.safeAlert('Pon un título');
    if (!this.selectedFile) return this.safeAlert('Selecciona un archivo');

    this.projectService
      .uploadProject(this.title.trim(), this.description.trim(), this.selectedFile)
      .subscribe({
        next: () => {
          this.title = '';
          this.description = '';
          this.selectedFile = null;
          this.loadProjects();
          this.safeAlert('Proyecto subido ✅');
        },
        error: (err) => {
          console.error(err);
          this.safeAlert('No se pudo subir');
        },
      });
  }

  // ✅ Mostrar quién subió
  uploaderName(p: any): string {
    return p?.user?.name || p?.user?.username || p?.user?.email || 'Desconocido';
  }

  // ✅ Editar
  startEdit(p: any): void {
    this.editingId = p.id;
    this.editTitle = p.title ?? '';
    this.editDescription = p.description ?? '';
    this.editStatus = p.status ?? 'activo';
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(id: number): void {
    if (!this.editTitle.trim()) return this.safeAlert('El título no puede ir vacío');

    this.projectService
      .updateProject(id, {
        title: this.editTitle.trim(),
        description: this.editDescription.trim(),
        status: this.editStatus,
      })
      .subscribe({
        next: () => {
          this.editingId = null;
          this.loadProjects();
          this.safeAlert('Editado ✅');
        },
        error: (err) => {
          console.error(err);
          this.safeAlert('No se pudo editar');
        },
      });
  }

  // ✅ Eliminar
  remove(id: number): void {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('¿Seguro que quieres eliminar este proyecto?');
      if (!ok) return;
    }

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.loadProjects();
        this.safeAlert('Eliminado ✅');
      },
      error: (err) => {
        console.error(err);
        this.safeAlert('No se pudo eliminar');
      },
    });
  }

  // ✅ Descargar
  download(id: number): void {
    this.projectService.downloadProject(id).subscribe({
      next: ({ blob, filename }) => {
        if (typeof window === 'undefined') return;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        this.safeAlert('No se pudo descargar');
      },
    });
  }

  trackById(_: number, p: any) {
    return p.id;
  }
}
