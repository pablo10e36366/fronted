import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRole, AdminService, User } from '../../../../core/data-access/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-users">
      <div class="toolbar">
        <h2>Gestión de Usuarios</h2>
        <button class="btn-primary" (click)="showCreateModal = true">+ Nuevo Usuario</button>
      </div>

      <div *ngIf="loading" class="info-banner">Cargando usuarios...</div>

      <div *ngIf="errorMessage" class="error-banner">
        {{ errorMessage }}
        <button (click)="errorMessage = ''">x</button>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users; trackBy: trackByUserId">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ getUserInitial(user) }}</div>
                  <span>{{ user.name || 'Sin nombre' }}</span>
                </div>
              </td>
              <td>{{ user.email || 'Sin email' }}</td>
              <td>
                <select
                  [ngModel]="user.role?.id ?? null"
                  (ngModelChange)="changeRole(user, $event)"
                  class="role-select">
                  <option [ngValue]="null" disabled>Sin rol</option>
                  <option *ngFor="let role of roles" [ngValue]="role.id">
                    {{ toRoleLabel(role.name) }}
                  </option>
                </select>
              </td>
              <td>
                <span class="status-dot" [class.active]="user.isActive"></span>
                {{ user.isActive ? 'Activo' : 'Bloqueado' }}
              </td>
              <td>
                <div class="actions">
                  <button
                    class="btn-icon"
                    [title]="user.isActive ? 'Bloquear' : 'Desbloquear'"
                    [class.danger]="user.isActive"
                    [class.success]="!user.isActive"
                    (click)="toggleBlock(user)">
                    {{ user.isActive ? '🚫' : '✅' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!users.length">
              <td colspan="5" class="empty-state">No hay usuarios para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showCreateModal">
        <div class="modal">
          <h3>Crear Nuevo Usuario</h3>
          <form (ngSubmit)="createUser()">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" [(ngModel)]="newUser.name" name="name" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="newUser.email" name="email" required />
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" [(ngModel)]="newUser.password" name="password" required minlength="6" />
            </div>
            <div class="form-group">
              <label>Rol</label>
              <select [(ngModel)]="newUser.roleId" name="roleId" required>
                <option *ngFor="let role of roles" [ngValue]="role.id">
                  {{ toRoleLabel(role.name) }}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showCreateModal = false">Cancelar</button>
              <button type="submit" class="btn-primary">Crear</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-users { padding: 1rem; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h2 { margin: 0; font-size: 1.5rem; color: var(--slate-800); }

    .btn-primary {
      background: var(--primary-600);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-secondary {
      background: var(--slate-200);
      color: var(--slate-700);
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .table-container {
      background: var(--card-bg, #fff);
      border-radius: 12px;
      box-shadow: var(--shadow-card);
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x;
      border: 1px solid var(--slate-200);
      max-width: 100%;
    }
    table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }
    th { text-align: left; padding: 1rem; background: var(--slate-50); color: var(--slate-500); font-weight: 600; font-size: 0.85rem; border-bottom: 1px solid var(--slate-200); }
    td { padding: 1rem; border-bottom: 1px solid var(--slate-100); color: var(--slate-700); }
    th, td { white-space: nowrap; }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 500; }
    .avatar { width: 32px; height: 32px; background: var(--primary-100); color: var(--primary-700); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }

    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; margin-right: 0.5rem; }
    .status-dot.active { background: #10b981; }

    .btn-icon { background: none; border: none; cursor: pointer; padding: 0.25rem; font-size: 1.2rem; opacity: 0.8; transition: opacity 0.2s; }
    .btn-icon:hover { opacity: 1; }
    .btn-icon.danger { color: #ef4444; }
    .btn-icon.success { color: #10b981; }

    .role-select {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--slate-300);
      background: var(--slate-100);
      color: var(--slate-800);
      min-width: 130px;
    }

    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
    }
    .modal {
      background: var(--card-bg, #fff); padding: 2rem; border-radius: 12px; width: 400px;
      box-shadow: var(--shadow-card-hover);
      border: 1px solid var(--slate-200);
      color: var(--slate-800);
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--slate-700); }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--slate-300);
      border-radius: 6px;
      background: var(--slate-100);
      color: var(--slate-800);
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }

    .error-banner {
      background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;
      display: flex; justify-content: space-between;
    }
    .info-banner {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .empty-state { text-align: center; color: #64748b; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  roles: AdminRole[] = [];
  showCreateModal = false;
  errorMessage = '';
  loading = false;

  newUser = {
    name: '',
    email: '',
    password: '',
    roleId: 2,
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar usuarios';
        this.loading = false;
      },
    });
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        if (this.roles.length && !this.roles.find((role) => role.id === this.newUser.roleId)) {
          this.newUser.roleId = this.roles[0].id;
        }
      },
      error: () => {
        this.errorMessage = 'Error al cargar roles';
      },
    });
  }

  createUser(): void {
    this.errorMessage = '';
    this.adminService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users = [user, ...this.users];
        this.showCreateModal = false;
        this.newUser = {
          name: '',
          email: '',
          password: '',
          roleId: this.roles[0]?.id || 2,
        };
      },
      error: (err) => {
        if (err?.status === 409) {
          this.errorMessage = 'El email ya está registrado.';
          return;
        }
        this.errorMessage = 'Error al crear usuario. Verifica los datos.';
      },
    });
  }

  changeRole(user: User, newRoleId: number | null): void {
    if (!newRoleId) return;
    this.adminService.changeUserRole(user.id, Number(newRoleId)).subscribe({
      next: (updatedUser) => {
        user.role = updatedUser.role;
      },
      error: () => {
        this.errorMessage = 'Error al cambiar rol';
      },
    });
  }

  toggleBlock(user: User): void {
    const newState = !user.isActive;
    this.adminService.blockUser(user.id, newState).subscribe({
      next: (updatedUser) => {
        user.isActive = updatedUser.isActive;
      },
      error: () => {
        this.errorMessage = 'Error al actualizar estado';
      },
    });
  }

  getUserInitial(user: User): string {
    const source = (user.name || user.email || '?').trim();
    return source.charAt(0).toUpperCase() || '?';
  }

  toRoleLabel(roleName: string | undefined | null): string {
    const role = String(roleName || '').toLowerCase();
    if (role === 'colaborador') return 'Estudiante';
    if (role === 'docente' || role === 'professor') return 'Docente';
    if (role === 'admin') return 'Admin';
    if (role === 'user' || role === 'usuario' || role === 'estudiante' || role === 'student') {
      return 'Estudiante';
    }
    return roleName || 'Sin rol';
  }

  trackByUserId(_index: number, user: User): number {
    return user.id;
  }
}
