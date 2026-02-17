import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectService } from '../../../../core/data-access/project.service';
import { Project } from '../../../../core/models/project.models';

@Component({
  selector: 'app-god-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="god-projects-container">
      <div class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar por nombre, owner o ID..." (input)="filter($event)">
        </div>
      </div>

      <div class="table-responsive">
        <table class="god-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Owner</th>
              <th>Estado</th>
              <th>Última Actividad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProjects">
              <td>
                <div class="project-info">
                  <span class="project-title">{{ p.title }}</span>
                  <span class="project-id">{{ p.id.substring(0, 8) }}...</span>
                </div>
              </td>
              <td>
                <div class="owner-info">
                  <div class="avatar-xs">{{ (p.owner?.name || 'U').charAt(0) }}</div>
                  <span>{{ p.owner?.name || 'Unknown' }}</span>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="'badge-' + (p.status?.toLowerCase() || 'draft')">
                  {{ p.status }}
                </span>
              </td>
              <td>{{ p.updatedAt | date:'medium' }}</td>
              <td>
                <button class="btn-icon" (click)="viewProject(p.id)" title="Ver (Solo Lectura)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .god-projects-container {
      padding: 1rem;
    }
    .toolbar {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--slate-100);
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-md);
      width: 300px;
    }
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      color: var(--slate-900);
    }
    .god-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .god-table th {
      text-align: left;
      padding: 1rem;
      color: var(--slate-500);
      border-bottom: 1px solid var(--slate-200);
      font-weight: 600;
    }
    .god-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--slate-100);
      color: var(--slate-700);
    }
    .project-info {
      display: flex;
      flex-direction: column;
    }
    .project-title { font-weight: 500; color: var(--slate-900); }
    .project-id { font-size: 0.75rem; color: var(--slate-400); font-family: monospace; }
    
    .owner-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .avatar-xs {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary-600);
      padding: 0.25rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    .btn-icon:hover {
      background: var(--primary-50);
    }

    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-draft { background: var(--slate-100); color: var(--slate-600); }
    .badge-in_progress { background: #dbeafe; color: #1e40af; }
    .badge-completed { background: #dcfce7; color: #166534; }
  `]
})
export class GodProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit() {
    this.projectService.getAllProjects().subscribe(projects => {
      this.projects = projects;
      this.filteredProjects = projects;
    });
  }

  filter(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredProjects = this.projects.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      (p.owner?.name?.toLowerCase().includes(term))
    );
  }

  viewProject(id: string) {
    this.router.navigate(['/projects', id], { queryParams: { mode: 'god' } });
  }
}
