import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ProjectService } from '../../core/data-access/project.service';
import { SessionService } from '../../core/auth/data-access/session.service';
import { MilestoneService } from '../../core/data-access/milestone.service';
import { EvidenceService } from '../../core/data-access/evidence-legacy.service';
import { AssignmentService, Assignment as BackendAssignment } from '../../core/data-access/assignment.service';
import { ProjectDto } from '../../core/models/project.models';
import { ActivityHeatmapComponent, ActivityHeatmapData } from '../../components/activity-heatmap/activity-heatmap';
import { FileUploadZoneComponent } from '../../components/file-upload-zone/file-upload-zone';
import { ProjectsAdminComponent } from './projects-admin.component';
import { ProjectsStudentComponent } from './projects-student.component';

// Estados de proyecto alineados con el backend (nuevos valores lowercase)
type ProjectStatusType = 'draft' | 'in_progress' | 'in_review' | 'completed';

// Constantes para UI de estados
const STATUS_CONFIG: Record<ProjectStatusType, { label: string; color: string; nextStates: ProjectStatusType[] }> = {
  'draft': { label: 'Borrador', color: '#9CA3AF', nextStates: ['in_progress'] },
  'in_progress': { label: 'En Progreso', color: '#2563EB', nextStates: ['in_review'] },
  'in_review': { label: 'En Revisión', color: '#F59E0B', nextStates: ['completed', 'in_progress'] },
  'completed': { label: 'Completado', color: '#10B981', nextStates: [] },
};

// Estados de entrega (Assignment) - compatibles con backend
type AssignmentStatus = 'PENDIENTE' | 'ENTREGADO' | 'REVISADO';

// Interfaz para UI que extiende el backend con campos calculados
interface Assignment extends BackendAssignment {
  // Campos adicionales para UI
  fileName: string;
  studentName: string;
  courseId: string;
  comment?: string;
  // isLate ya está incluido en BackendAssignment desde assignment.service.ts
}

// Interfaz extendida para UI
interface ProjectUI extends ProjectDto {
  tags: string[];
  progress: number;
  uiStatus: ProjectStatusType;
  students?: number; // Campo opcional para número de estudiantes
}

@Component({
  standalone: true,
  selector: 'app-projects',
  templateUrl: './projects.html',
  styleUrls: ['./projects.css'],
  imports: [CommonModule, FormsModule, RouterModule, ProjectsAdminComponent, ProjectsStudentComponent],
})
export class ProjectsComponent implements OnInit {
  @ViewChild(FileUploadZoneComponent) fileUploadZone!: FileUploadZoneComponent;
  heatmapData: ActivityHeatmapData[] = [];

  // 🔹 LISTA DE PROYECTOS (UI ENRIQUECIDA)
  projects: ProjectUI[] = [];
  filteredProjects: ProjectUI[] = []; // Para búsqueda/filtros

  // 🔹 KPIs
  kpiTotal = 0;
  kpiReview = 0;
  kpiCompleted = 0;
  kpiScore = 98; // Mock

  // 🔹 FILTROS TOOLBAR
  searchTerm = '';
  searchSubject = new Subject<string>();
  filterStatus = 'ALL';
  filterTech = 'ALL';

  // 🔹 ORDENAMIENTO
  sortBy: 'title' | 'createdAt' | 'progress' | 'status' = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // 🔹 FORMULARIO
  title = '';
  description = '';
  selectedFile: File | null = null;
  joinCode = '';
  assignmentFile: File | null = null;
  assignmentComment = '';
  selectedMilestoneId = '';
  assignmentStatus: AssignmentStatus = 'PENDIENTE';
  isLate = false; // Indica si la entrega actual es tardía

  // 🔹 ASIGNACIONES (solo para DOCENTE)
  assignments: Assignment[] = [];
  selectedAssignment: Assignment | null = null;
  reviewFeedback = '';
  showReviewModal = false;

  // 🔹 ESTADOS UI
  loading = false;
  errorMessage = '';
  successMessage = '';

  // 🔹 EDIT MODAL
  showEditModal = false;
  editingProject: ProjectUI | null = null;
  editTitle = '';
  editDescription = '';

  // 🔹 STATUS CHANGE
  statusMenuOpen = false;
  selectedProject: ProjectUI | null = null;
  // role usado por la plantilla para render condicional
  role: string | null = null;

  constructor(
    private projectsService: ProjectService,
    private SessionService: SessionService,
    private milestoneService: MilestoneService,
    private evidenceService: EvidenceService,
    private assignmentService: AssignmentService,
    private router: Router
  ) { }

  ngAfterContentInit(): void {
    // Normalizar rol a minúsculas para el switch en la plantilla
    const r = this.SessionService.getRole();
    this.role = r ? String(r).toLowerCase() : null;
    // Asegurar separación de CSS: cuando sea docente, cargamos solo estilos de docente
    // (Los componentes standalone ya traen sus propios styleUrls, por tanto no hay colisión global)
  }

  get isProfessor(): boolean {
  return true;
 }


  get isStudent(): boolean {
    return this.SessionService.getRole() === 'estudiante';
  }

  // === PROPERTIES FOR PROFESSOR DASHBOARD ===
  profileDropdownOpen = false;
  currentUserInitials = 'CP';
  currentUserName = 'Carlos Pérez';

  // === PROFESSOR DASHBOARD METHODS ===
  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  logout(): void {
    this.SessionService.logout();
    // Navigate to login would be handled by router
  }

  // === PROFESSOR DASHBOARD NAVIGATION METHODS ===
  goToCourses(): void {
    console.log('Navigate to Courses');
  }

  goToStudents(): void {
    console.log('Navigate to Students');
  }

  goToGrades(): void {
    console.log('Navigate to Grades');
  }

  goToSubmissions(): void {
    console.log('Navigate to Submissions');
  }

  goToCalendar(): void {
    console.log('Navigate to Calendar');
  }

  // getCourses() devuelve los proyectos reales cargados desde el backend
  getCourses(): ProjectUI[] {
    return this.projects;
  }

  manageCourse(courseId: string): void {
    this.router.navigate(['/projects', courseId]);
  }

  createNewCourse(): void {
    this.router.navigate(['/projects']);
  }

  exportCourses(): void {
    console.log('Export courses');
  }

  copyCourseCode(courseId: string): void {
    navigator.clipboard.writeText(courseId);
    console.log('Copied:', courseId);
  }

  // TODO: UI needed - input para código de curso
  joinCourseByCode(code: string): void {
    if (!code.trim()) {
      this.errorMessage = 'Ingresa un código válido';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.projectsService.joinByCode(code).subscribe({
      next: () => {
        this.successMessage = 'Te has unido al curso correctamente';
        this.loading = false;
        this.loadProjects();
      },
      error: (err: any) => {
        this.loading = false;
        this.handleError(err);
      },
    });
  }

  viewCourseStudents(courseId: string): void {
    // TODO: Navegación real a vista de estudiantes cuando esté implementada
    this.router.navigate(['/projects', courseId]);
  }

  // Crear una entrega (assignment) como hito (stub para DOCENTE)
  createAssignment(courseId: string): void {
    // TODO: UI para título, descripción, deadline
    const title = `Entrega ${new Date().toLocaleDateString()}`;
    const description = 'Descripción de la entrega creada desde el dashboard DOCENTE';
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // una semana desde hoy

    this.milestoneService.createMilestone({
      projectId: courseId,
      title,
      description,
      dueDate
    }).subscribe({
      next: () => {
        console.log('Entrega creada exitosamente');
        this.successMessage = 'Entrega creada correctamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => {
        console.error('Error creando entrega:', err);
        this.errorMessage = 'Error al crear la entrega';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Subir una entrega (archivo + comentario) para ESTUDIANTE
  submitAssignment(projectId: string, milestoneId: string, file: File | null, comment: string): void {
    // Bloquear si el estado actual es REVISADO
    if (this.assignmentStatus === 'REVISADO') {
      this.errorMessage = 'No puedes re-enviar una entrega ya revisada';
      return;
    }
    if (!file) {
      this.errorMessage = 'Selecciona un archivo';
      return;
    }
    if (!milestoneId.trim()) {
      this.errorMessage = 'Ingresa un ID de hito válido';
      return;
    }
    // TODO: Implementar upload real usando EvidenceService
    // Por ahora, simular éxito
    console.log('Subiendo entrega:', { projectId, milestoneId, file, comment });
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulación de éxito
    setTimeout(() => {
      this.loading = false;
      this.successMessage = 'Entrega enviada correctamente';
      this.assignmentStatus = 'ENTREGADO';
      this.assignmentFile = null;
      this.assignmentComment = '';
      setTimeout(() => this.successMessage = '', 3000);
    }, 1000);
  }

  onAssignmentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.assignmentFile = input.files[0];
    }
  }

  // === MÉTODOS PARA REVISIÓN DE ENTREGAS (DOCENTE) ===

  /**
   * Abre el modal para revisar una entrega.
   */
  reviewAssignment(assignment: Assignment): void {
    this.selectedAssignment = assignment;
    this.reviewFeedback = assignment.feedback || '';
    this.showReviewModal = true;
  }

  /**
   * Cierra el modal de revisión.
   */
  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedAssignment = null;
    this.reviewFeedback = '';
  }

  /**
   * Marca la entrega como revisada y guarda el feedback (backend real).
   */
  setAssignmentReviewed(assignmentId: string, comment: string): void {
    this.loading = true;
    this.assignmentService.review(assignmentId, comment).subscribe({
      next: (updatedAssignment) => {
        // Actualizar assignment en la lista local
        const index = this.assignments.findIndex(a => a.id === assignmentId);
        if (index !== -1) {
          this.assignments[index] = this.enrichAssignment(updatedAssignment);
        }
        this.successMessage = 'Entrega marcada como revisada';
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
        this.closeReviewModal();
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  /**
   * Obtener las entregas de un curso específico (stub).
   */
  getAssignmentsByCourse(courseId: string): Assignment[] {
    return this.assignments.filter(a => a.courseId === courseId);
  }

  /**
   * Ver entregas de un curso (stub).
   */
  viewCourseSubmissions(courseId: string): void {
    console.log('Ver entregas del curso:', courseId);
  }

  /**
   * Abrir curso (stub).
   */
  openCourse(courseId: string): void {
    this.router.navigate(['/projects', courseId]);
  }

  // Verificar si usuario puede cambiar estado (DOCENTE o admin)
  canChangeStatus(): boolean {
    const role = this.SessionService.getRole();
    return role === 'DOCENTE' || role === 'admin';
  }

  get canCreate(): boolean {
    const role = this.SessionService.getRole();
    return !!role; // Todos los roles pueden
  }

  get canDelete(): boolean {
    const role = this.SessionService.getRole();
    return !!role; // Todos los roles pueden
  }

  get canEdit(): boolean {
    const role = this.SessionService.getRole();
    return !!role; // Todos los roles pueden
  }

  ngOnInit(): void {
    this.loadProjects();

    // Configurar búsqueda con debounce (Backend + Local filtering)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        // Si hay término de búsqueda, usar backend
        if (term.trim()) {
          this.loading = true;
          return this.projectsService.searchProjects(term);
        }
        // Si está vacío, retornar proyectos actuales para filtro local
        return [this.projects];
      })
    ).subscribe({
      next: (result) => {
        if (this.searchTerm.trim()) {
          // Búsqueda backend: enriquecer y aplicar filtros de estado/tech
          this.projects = result.map(p => this.enrichProject(p));
        }
        // Aplicar filtros locales (estado, tech)
        this.applyFilters();
        this.updateKPIs();
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err);
        this.loading = false;
      }
    });

    // Simular datos de heatmap por ahora (hasta conectar servicio)
    this.heatmapData = [
      { date: '2023-10-01', count: 5 },
      { date: '2023-10-02', count: 2 },
      { date: '2023-10-05', count: 8 },
    ];
  }

  // 🔹 CARGAR PROYECTOS
  loadProjects(): void {
    this.projectsService.getMyProjects().subscribe({
      next: (projects) => {
        // Mapear a estructura UI con datos mock enriquecidos
        this.projects = projects.map(p => this.enrichProject(p));
        this.applyFilters();
        this.updateKPIs();
        
        // Si es profesor, cargar assignments después de tener los proyectos
        if (this.isProfessor) {
          this.loadAssignments();
        }
      },
      error: (err) => this.handleError(err),
    });
  }

  // 🔹 CARGAR ASSIGNMENTS DESDE BACKEND (solo para DOCENTE)
  private loadAssignments(): void {
    if (!this.isProfessor) {
      return;
    }

    // Limpiar assignments previos
    this.assignments = [];
    
    // Para cada proyecto (curso) del profesor, obtener sus assignments
    const projectIds = this.projects.map(p => p.id);
    if (projectIds.length === 0) {
      return;
    }

    // Usar Promise.all para cargar assignments de todos los proyectos en paralelo
    const assignmentPromises = projectIds.map(projectId =>
      this.assignmentService.getByProject(projectId).toPromise()
        .then(assignments => assignments || [])
        .catch(err => {
          console.error(`Error cargando assignments para proyecto ${projectId}:`, err);
          return [];
        })
    );

    Promise.all(assignmentPromises).then(results => {
      // Aplanar array de arrays
      const allAssignments = results.flat();
      
      // Enriquecer cada assignment con campos UI
      this.assignments = allAssignments.map(a => this.enrichAssignment(a));
      
      console.log(`Cargados ${this.assignments.length} assignments desde backend`);
    });
  }

  // Helper para enriquecer proyecto con datos de UI
  private enrichProject(project: ProjectDto): ProjectUI {
    // Tags simulados (hasta que el backend los provea)
    const mockTagsPool = [['Angular', 'Frontend'], ['NestJS', 'Backend'], ['Design', 'Figma'], ['Docs'], ['Math', 'Calculus']];

    // Calcular progreso basado en estado real
    const progressMap: Record<ProjectStatusType, number> = {
      'draft': 10,
      'in_progress': 40,
      'in_review': 70,
      'completed': 100,
    };

    // Usar estado del backend directamente (normalizar a lowercase)
    const rawStatus = (project.status || 'draft').toLowerCase() as ProjectStatusType;
    const uiStatus = (['draft', 'in_progress', 'in_review', 'completed'].includes(rawStatus))
      ? rawStatus as ProjectStatusType
      : 'draft';

    return {
      ...project,
      tags: mockTagsPool[Math.floor(Math.random() * mockTagsPool.length)], // This is random, ideally would come from backend
      progress: progressMap[uiStatus] || 0,
      uiStatus
    };
  }

  // Helper para enriquecer assignment con campos UI
  private enrichAssignment(backendAssignment: BackendAssignment): Assignment {
    // Generar nombre de archivo basado en evidence o milestone
    const fileName = backendAssignment.evidence?.title || 'archivo_sin_título';
    // Obtener nombre del estudiante
    const studentName = backendAssignment.student?.name || `Estudiante ${backendAssignment.studentId}`;
    // courseId es projectId
    const courseId = backendAssignment.projectId;

    return {
      ...backendAssignment,
      fileName,
      studentName,
      courseId,
      comment: backendAssignment.feedback || undefined,
    };
  }

  updateKPIs(): void {
    this.kpiTotal = this.projects.length;
    this.kpiReview = this.projects.filter(p => p.uiStatus === 'in_review').length;
    this.kpiCompleted = this.projects.filter(p => p.uiStatus === 'completed').length;
    // Score basado en proyectos completados
    this.kpiScore = this.kpiTotal > 0 ? Math.round((this.kpiCompleted / this.kpiTotal) * 100) : 0;
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(p => {
      // Si hay término de búsqueda, el backend ya filtró por texto
      // Solo aplicar filtro de texto cuando NO hay búsqueda backend (term vacío)
      const matchSearch = !term.trim() || (
        p.title.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        p.tags.some(t => t.toLowerCase().includes(term)) ||
        (p.owner?.name || '').toLowerCase().includes(term)
      );

      const matchStatus = this.filterStatus === 'ALL' || p.uiStatus === this.filterStatus.toLowerCase();
      // tech filter mock
      const matchTech = this.filterTech === 'ALL' || p.tags.some(t => t.toUpperCase().includes(this.filterTech));

      return matchSearch && matchStatus && matchTech;
    });

    // Aplicar ordenamiento
    this.applySorting();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  // 🔹 ORDENAMIENTO
  applySorting(): void {
    this.filteredProjects.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'status':
          aValue = a.uiStatus;
          bValue = b.uiStatus;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  changeSorting(field: 'title' | 'createdAt' | 'progress' | 'status'): void {
    if (this.sortBy === field) {
      // Cambiar dirección si es el mismo campo
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Cambiar campo y establecer dirección ascendente por defecto
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  getSortIcon(field: 'title' | 'createdAt' | 'progress' | 'status'): string {
    if (this.sortBy !== field) {
      return '↕️'; // Icono neutro
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }



  // 🔹 CAMBIO DE ARCHIVO
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // 🔹 ARCHIVO ARRASTRADO
  onFileDropped(file: File): void {
    this.selectedFile = file || null;
  }

  // 🔹 TEMPLATE REFERENCE PARA noProjects
  get noProjects(): boolean {
    return this.filteredProjects.length === 0;
  }

  // 🔹 SUBIR PROYECTO
  createProject(): void {
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
          this.successMessage = 'Proyecto creado correctamente';
          this.title = '';
          this.description = '';
          this.selectedFile = null;
          if (this.fileUploadZone) {
            this.fileUploadZone.reset();
          }
          this.loading = false;
          this.loadProjects(); // recargar lista
        },
        error: (err: HttpErrorResponse | any) => {
          this.loading = false;
          this.handleError(err);
        },
      });
  }

  // 🔹 DESCARGAR ARCHIVO
  downloadProject(project: ProjectUI): void {
    this.projectsService.downloadProjectFile(project.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Usar el filename original del proyecto, o el título como fallback
        a.download = project.filename || `${project.title}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      },
    });
  }

  // 🔹 ELIMINAR PROYECTO
  deleteProject(projectId: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    this.projectsService.deleteProject(projectId).subscribe({
      next: () => {
        this.successMessage = 'Proyecto eliminado correctamente';
        this.loadProjects(); // Recargar lista
      },
      error: (err) => this.handleError(err),
    });
  }

  private handleError(err: any): void {
    this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error');
  }

  // 🔹 MODIFICAR PROYECTO
  editProject(project: ProjectUI): void {
    this.editingProject = project;
    this.editTitle = project.title;
    this.editDescription = project.description || '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProject = null;
  }

  saveEdit(): void {
    if (!this.editingProject) return;

    this.loading = true;
    this.projectsService.updateProject(this.editingProject.id, this.editTitle, this.editDescription).subscribe({
      next: () => {
        this.successMessage = 'Proyecto actualizado correctamente';
        this.loading = false;
        this.closeEditModal();
        this.loadProjects();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      },
    });
  }

  // 🔹 UX HELPER
  focusNewProject(): void {
    const titleInput = document.querySelector('input[name="title"]') as HTMLElement;
    if (titleInput) {
      titleInput.focus();
      titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 🔹 VER DETALLES DEL PROYECTO
  viewProject(projectId: string): void {
    this.projectsService.getProjectDetails(projectId).subscribe({
      next: (project) => {
        // Mostrar detalles en un modal o alert
        alert(`Detalles del proyecto:\n\nTítulo: ${project.title}\nDescripción: ${project.description || 'N/A'}\nEstado: ${project.status}\nFecha: ${project.createdAt}`);
      },
      error: (err) => {
        this.errorMessage = (typeof err === 'string') ? err : (err?.message || 'Error inesperado');
      },
    });
  }

  // 🔹 STATUS MANAGEMENT
  getStatusLabel(status: string): string {
    const s = status.toLowerCase() as ProjectStatusType;
    return STATUS_CONFIG[s]?.label || status;
  }

  getStatusColor(status: string): string {
    const s = status.toLowerCase() as ProjectStatusType;
    return STATUS_CONFIG[s]?.color || '#9CA3AF';
  }

  getNextStates(status: string): string[] {
    const s = status.toLowerCase() as ProjectStatusType;
    return STATUS_CONFIG[s]?.nextStates || [];
  }

  // Se actualiza dinámicamente desde el backend
  availableTransitions: string[] = [];

  openStatusMenu(project: ProjectUI): void {
    if (this.statusMenuOpen && this.selectedProject?.id === project.id) {
      this.statusMenuOpen = false;
      this.selectedProject = null;
      return;
    }

    this.statusMenuOpen = true;
    this.selectedProject = project;
    this.availableTransitions = []; // Limpiar previo

    // Obtener transiciones válidas del backend
    this.projectsService.getProjectTransitions(project.id).subscribe({
      next: (data: { availableStates: string[]; }) => {
        this.availableTransitions = data.availableStates;
      },
      error: () => {
        this.availableTransitions = [];
        console.error('Error cargando transiciones');
      }
    });
  }

  changeProjectStatus(project: ProjectUI, newStatus: string): void {
    this.statusMenuOpen = false;
    this.selectedProject = null;

    this.projectsService.changeProjectStatus(project.id, newStatus).subscribe({
      next: (updatedProject: ProjectDto) => {
        this.updateProjectInList(updatedProject);
        this.successMessage = `Estado cambiado a "${this.getStatusLabel(newStatus)}"`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => this.handleError(err),
    });
  }

  // 🔹 ADMIN ACTIONS
  get isAdmin(): boolean {
    return this.SessionService.getRole() === 'admin';
  }

  forceStatusProject: ProjectUI | null = null;
  forceStatusValue = '';
  forceStatusReason = '';
  showForceStatusModal = false;

  openForceStatusModal(project: ProjectUI): void {
    this.forceStatusProject = project;
    this.forceStatusValue = project.status ?? ''; // Default actual
    this.forceStatusReason = '';
    this.showForceStatusModal = true;
  }

  confirmForceStatus(): void {
    if (!this.forceStatusProject || !this.forceStatusReason) return;

    this.projectsService.forceStatusChange(
      this.forceStatusProject.id,
      this.forceStatusValue,
      this.forceStatusReason
    ).subscribe({
      next: (updated) => {
        this.updateProjectInList(updated);
        this.successMessage = 'Estado forzado correctamente';
        this.showForceStatusModal = false;
        this.forceStatusProject = null;
      },
      error: (err) => this.handleError(err)
    });
  }

  archiveProject(project: ProjectUI): void {
    if (!confirm(`¿Archivar proyecto "${project.title}"?`)) return;

    this.projectsService.archiveProject(project.id, 'Archivado por admin').subscribe({
      next: (updated) => {
        // Opción A: Quitar de la lista
        this.projects = this.projects.filter(p => p.id !== updated.id);
        this.applyFilters();
        this.updateKPIs();
        this.successMessage = 'Proyecto archivado';
      },
      error: (err) => this.handleError(err)
    });
  }

  private updateProjectInList(updatedProject: ProjectDto): void {
    const index = this.projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
      this.projects[index] = this.enrichProject(updatedProject);
      this.applyFilters();
      this.updateKPIs();
    }
  }
}


