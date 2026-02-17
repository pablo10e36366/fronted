import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RepositoryViewDto, CreateEvidenceDto, EvidenceDto, EvidenceStatus } from '../../core/models/project.models';
import { ProjectService } from '../../core/data-access/project.service';
import { EvidenceService } from '../../core/data-access/evidence.service';
import type { StudentFilesByActivityGroup } from '../../core/data-access/evidence.service';
import { RepositoryHeaderComponent } from '../../components/repository-header/repository-header';
import { CollaborativeEditorComponent } from '../../components/collaborative-editor/collaborative-editor';
import { EvidenceDialogComponent } from '../../components/evidence-dialog/evidence-dialog';
import { ReviewPanelComponent } from '../../components/review-panel/review-panel';
import { SessionService } from '../../core/auth/data-access/session.service';
import { ProjectAccessService, ProjectAccessDto } from '../../core/data-access/project-access.service';
import { AccessRequestButtonComponent } from '../../components/access-request-button/access-request-button';
import { AccessManagementPanelComponent } from '../../components/access-management-panel/access-management-panel';

interface Breadcrumb {
  id: string | null;
  name: string;
}

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
	    RepositoryHeaderComponent,
	    CollaborativeEditorComponent,
	    ReviewPanelComponent,
	    AccessRequestButtonComponent,
	    AccessManagementPanelComponent
	  ],
  template: `
    <div class="repository-page">
      <div class="repository-content" *ngIf="repositoryView; else loading">
        
        <!-- GOD MODE BANNER -->
        <div class="god-mode-banner" *ngIf="isGodMode">
            <span class="banner-icon">👁️</span>
            <span>MODO GOD: VISTA DE SOLO LECTURA</span>
        </div>
        
        <!-- HEADER COMPONENT -->
        <app-repository-header
          [header]="repositoryView.header"
          [stats]="repositoryView.stats">
        </app-repository-header>

	        <!-- ACCESS CONTROL PANEL (Owner only) -->
	        <app-access-management-panel
	          *ngIf="isOwner && !isGodMode"
	          [projectId]="projectId"
	          (onUpdate)="checkMyPermission()">
	        </app-access-management-panel>
	
	        <!-- ACCESS CONTROL PANEL (Docente) -->
	        <app-access-management-panel
	          *ngIf="isTeacher && showTeacherAccessPanel && !isGodMode"
	          [projectId]="projectId"
	          [forceVisible]="true"
	          (onUpdate)="checkMyPermission()">
	        </app-access-management-panel>

	        <!-- ACCESS REQUEST BUTTON (Non-owner) -->
	        <div *ngIf="!isOwner && !isGodMode" class="access-request-section">
	          <button
	            *ngIf="isTeacher"
	            type="button"
	            class="btn btn-primary"
	            (click)="toggleTeacherAccessPanel()">
	            🔓 {{ showTeacherAccessPanel ? 'Cerrar permisos' : 'Permitir acceso' }}
	          </button>

	          <app-access-request-button
	            *ngIf="!isTeacher"
	            [projectId]="projectId"
	            [currentPermission]="myPermission"
	            (onRequest)="checkMyPermission()">
	          </app-access-request-button>
	        </div>

        <!-- TABS -->
        <div class="content-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab === 'files'"
            (click)="activeTab = 'files'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Archivos
	          </button>
	          <button
	            class="tab-btn"
	            [class.active]="activeTab === 'history'"
	            (click)="setActiveTab('history')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Historial
          </button>
        </div>

        <!-- TAB: FILES -->
        <div class="file-system-card" *ngIf="activeTab === 'files'">
          
          <!-- EDITOR MODE -->
          <ng-container *ngIf="editorFile; else explorerMode">
            <div class="editor-wrapper">
              <div class="editor-toolbar">
                <button class="btn-text" (click)="closeEditor()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  Volver a archivos
                </button>
                <span class="editor-filename">{{ editorFile.title }}</span>
              </div>
              <app-collaborative-editor
                [evidenceId]="editorFile.id"
                [initialContent]="editorFile.contentBlob || ''"
                (close)="closeEditor()">
              </app-collaborative-editor>
            </div>
          </ng-container>

          <!-- EXPLORER MODE -->
          <ng-template #explorerMode>
            <div class="explorer-header">
              <div class="breadcrumbs">
                <span
                  class="crumb root"
                  [class.active]="currentFolderId === null"
                  (click)="navigateTo(null, 'Root')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </span>
                <ng-container *ngFor="let crumb of breadcrumbs">
                  <span class="separator">/</span>
                  <span
                    class="crumb"
                    [class.active]="currentFolderId === crumb.id"
                    (click)="navigateTo(crumb.id, crumb.name)">
                    {{ crumb.name }}
                  </span>
                </ng-container>
              </div>
              
              <div class="explorer-actions" *ngIf="canCreateContent">
                <button class="btn btn-sm btn-outline" (click)="createFolder()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  Nueva Carpeta
                </button>
                <button class="btn btn-sm btn-primary" (click)="openEvidenceDialog()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  Nuevo Archivo
                </button>
              </div>
            </div>

            <div class="activity-groups" *ngIf="isTeacher && currentFolderId === null">
              <div *ngIf="studentFilesByActivity.length === 0" class="empty-folder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <p>No hay evidencias de estudiantes aun.</p>
              </div>

              <div *ngFor="let group of studentFilesByActivity" class="activity-group">
                <div
                  class="activity-group-header"
                  [class.clickable]="!!group.activityId"
                  (click)="group.activityId && navigateTo(group.activityId, group.activityTitle)">
                  <h4 class="activity-title">{{ group.activityTitle }}</h4>
                  <span class="activity-count">{{ group.files.length }} evidencias</span>
                </div>

                <div class="activity-files">
                  <div
                    *ngFor="let file of group.files"
                    class="file-item"
                    (click)="onItemClick(file)">
                    <div class="item-icon">
                      <svg class="icon-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div class="item-details">
                      <span class="item-name">{{ file.title }}</span>
                      <span class="item-author" *ngIf="file.author">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Subido por {{ file.author.name || file.author.email }}
                      </span>
                    </div>
                    <div class="item-meta">
                      <span class="update-date">{{ file.createdAt | date:'short' }}</span>
                    </div>
                    <div class="item-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="file-list" *ngIf="!isTeacher || currentFolderId !== null">
              <div *ngIf="files.length === 0" class="empty-folder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <p>Esta carpeta está vacía.</p>
              </div>

              <div
                *ngFor="let file of files"
                class="file-item"
                (click)="onItemClick(file)">
                <div class="item-icon">
                  <!-- Folder Icon -->
                  <svg *ngIf="file.isFolder" class="icon-folder" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  <!-- File Icon -->
                  <svg *ngIf="!file.isFolder" class="icon-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="item-details">
                  <span class="item-name">{{ file.title }}</span>
                  <span class="item-desc" *ngIf="file.description">{{ file.description }}</span>
                  <span class="item-author" *ngIf="file.author">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Subido por {{ file.author.name || file.author.email }}
                  </span>
                </div>
                <div class="item-meta">
                  <span class="update-date">{{ file.createdAt | date:'short' }}</span>
                </div>
                <div class="item-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
          </ng-template>
        </div>

	        <!-- TAB: HISTORY - Solo actividad del usuario actual -->
	        <div class="history-card" *ngIf="activeTab === 'history'">
          <div class="history-header-info">
            <h3>📋 Tu Actividad en el Proyecto</h3>
            <p class="history-subtitle">Solo se muestran tus acciones en este proyecto</p>
          </div>
          
          <div class="history-list" *ngIf="history.length > 0; else noHistory">
             <div class="history-item" *ngFor="let log of history">
                <div class="history-icon" [ngClass]="getHistoryIconClass(log.action)">
                  <span class="history-icon-emoji">{{ log.icon || '📝' }}</span>
                </div>
                <div class="history-content">
                  <div class="history-header">
                     <span class="history-user">{{ log.user.name }}</span>
                     <span class="history-action">{{ formatAction(log.action) }}</span>
                  </div>
                  <div class="history-meta">
                    {{ log.createdAt | date:'medium' }}
                  </div>
                  <div class="history-description">
                    {{ log.description || getHistoryDescription(log) }}
                  </div>
                  <div class="history-details" *ngIf="log.metadata">
                     <span *ngIf="log.action === 'PROJECT_STATUS_CHANGE'">
                       De <strong>{{ log.metadata.previousStatus }}</strong> a <strong>{{ log.metadata.newStatus }}</strong>
                     </span>
                     <span *ngIf="log.action === 'EVIDENCE_UPLOAD' && log.metadata.evidenceTitle">
                       Archivo: <strong>{{ log.metadata.evidenceTitle }}</strong>
                     </span>
                     <span *ngIf="log.action === 'FILE_UPLOAD' && log.metadata.fileName">
                       Archivo: <strong>{{ log.metadata.fileName }}</strong>
                     </span>
                     <span *ngIf="log.action === 'FOLDER_CREATE' && log.metadata.folderName">
                       Carpeta: <strong>{{ log.metadata.folderName }}</strong>
                     </span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noHistory>
              <div class="empty-state-history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>No has realizado ninguna actividad en este proyecto aún.</p>
                <p class="empty-subtitle">El historial muestra solo tus acciones.</p>
              </div>
            </ng-template>
         </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando repositorio...</p>
        </div>
      </ng-template>

      <!-- Botón Flotante para Revisar Proyecto -->
      <button *ngIf="!isGodMode" class="btn-review-floating" (click)="openReviewPanel()" title="Revisar Proyecto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </button>

      <!-- Review Panel Overlay -->
      <div class="review-panel-overlay" *ngIf="showReviewPanel">
        <div class="review-panel-wrapper">
          <div class="panel-header">
            <h3>Evaluación del Proyecto</h3>
            <button class="btn-close" (click)="closeReviewPanel()">✕</button>
          </div>
          <app-review-panel 
            [projectId]="projectId">
          </app-review-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .review-panel-overlay {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 400px;
      background: white;
      box-shadow: -4px 0 20px rgba(0,0,0,0.1);
      z-index: 1000;
      padding: 0;
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .access-request-section {
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border: 1px solid rgba(102, 126, 234, 0.1);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .review-panel-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .panel-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--slate-50);
    }

    .panel-header h3 { margin: 0; font-size: 1.1rem; color: var(--slate-800); }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--slate-400);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close:hover { background: var(--slate-200); color: var(--slate-600); }

    .repository-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 2rem;
    }

    .repository-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .god-mode-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #fca5a5;
      padding: 1rem;
      border-radius: var(--border-radius-lg);
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 1px solid #7f1d1d;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
      animation: pulseBanner 2s infinite;
    }
    
    @keyframes pulseBanner {
       0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
       70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
       100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }

    /* TABS */
    .content-tabs {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px 12px 0 0;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      bottom: -1px;
    }

    .tab-btn:hover {
      color: #334155;
      background: #f8fafc;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
      color: #667eea;
      border-bottom-color: transparent;
      font-weight: 600;
    }

	    .history-card {
	      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
	      border: 1px solid rgba(102, 126, 234, 0.1);
	      border-radius: 0 20px 20px 20px;
	      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
	      overflow: hidden;
	      padding: 1.5rem;
	    }

    /* HISTORY STYLES */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .history-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .history-icon-emoji {
      font-size: 1.5rem;
      line-height: 1;
    }

    .bg-create { background: #3b82f6; } /* Blue */
    .bg-status { background: #10b981; } /* Green */
    .bg-upload { background: #f59e0b; } /* Amber */
    .bg-default { background: #94a3b8; } /* Gray */

    .history-content {
      flex: 1;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .history-user {
      font-weight: 600;
      color: #1e293b;
    }

    .history-action {
      font-size: 0.875rem;
      color: #64748b;
    }

    .history-meta {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .history-description {
      font-size: 0.9rem;
      color: #334155;
      margin: 0.5rem 0;
      line-height: 1.4;
    }

    .history-details {
      font-size: 0.8rem;
      color: #475569;
      background: rgba(255,255,255,0.5);
      padding: 0.5rem;
      border-radius: 6px;
      margin-top: 0.5rem;
    }

    .empty-state-history {
      text-align: center;
      padding: 3rem;
      color: #94a3b8;
    }

    /* CARD SYSTEM - Premium Style */
    .file-system-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
      border: 1px solid rgba(102, 126, 234, 0.1);
      border-radius: 0 20px 20px 20px; /* Modified to match tabs */
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    /* EXPLORER HEADER */
    .explorer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
      border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #64748b;
    }

    .crumb {
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #667eea;
      transition: all 0.2s;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .crumb:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #764ba2;
    }

    .crumb.root svg {
      color: #667eea;
    }

    .crumb.active {
      color: #1e293b;
      font-weight: 600;
      cursor: default;
      background: none;
    }

    .separator {
      color: #cbd5e1;
    }

	    .explorer-actions {
	      display: flex;
	      gap: 0.75rem;
	    }

	    /* TEACHER GROUPED VIEW */
	    .activity-groups {
	      display: flex;
	      flex-direction: column;
	      gap: 1.25rem;
	      padding: 0.5rem 0;
	    }

	    .activity-group {
	      background: white;
	      border: 1px solid rgba(102, 126, 234, 0.08);
	      border-radius: 16px;
	      overflow: hidden;
	      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.06);
	    }

	    .activity-group-header {
	      display: flex;
	      align-items: center;
	      justify-content: space-between;
	      padding: 1rem 1.5rem;
	      background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.04) 100%);
	      border-bottom: 1px solid rgba(102, 126, 234, 0.08);
	    }

	    .activity-group-header.clickable {
	      cursor: pointer;
	    }

	    .activity-group-header.clickable:hover {
	      background: linear-gradient(135deg, rgba(102, 126, 234, 0.10) 0%, rgba(118, 75, 162, 0.07) 100%);
	    }

	    .activity-title {
	      margin: 0;
	      font-size: 1rem;
	      font-weight: 800;
	      color: #1e293b;
	    }

	    .activity-count {
	      font-size: 0.85rem;
	      font-weight: 600;
	      color: #64748b;
	    }

	    .activity-files {
	      display: flex;
	      flex-direction: column;
	    }

	    /* FILE LIST */
	    .file-list {
	      display: flex;
	      flex-direction: column;
	    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(102, 126, 234, 0.05);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .file-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .file-item:last-child {
      border-bottom: none;
    }

    .file-item:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.02) 100%);
    }

    .file-item:hover::before {
      opacity: 1;
    }

    .item-icon {
      margin-right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      transition: transform 0.2s;
    }

    .file-item:hover .item-icon {
      transform: scale(1.1);
    }

    .icon-folder {
      color: #667eea;
      width: 22px;
      height: 22px;
      filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
    }

    .icon-file {
      color: #94a3b8;
      width: 22px;
      height: 22px;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-size: 0.925rem;
      font-weight: 600;
      color: #1e293b;
    }

    .item-desc {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .item-author {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #667eea;
      margin-top: 0.375rem;
      font-weight: 500;
    }

    .item-author svg {
      color: #667eea;
    }

    .item-meta {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-right: 1.5rem;
    }

    .item-arrow {
      color: #cbd5e1;
      transition: all 0.3s;
    }

    .file-item:hover .item-arrow {
      color: #667eea;
      transform: translateX(6px);
    }

    .empty-folder {
      padding: 4rem 1rem;
      text-align: center;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    }

    .empty-folder svg {
      opacity: 0.5;
    }

    /* BUTTONS - Premium Style */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-outline {
      background: white;
      border: 1px solid rgba(102, 126, 234, 0.3);
      color: #667eea;
    }

    .btn-outline:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-color: #667eea;
    }
    
    .btn-text {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .btn-text:hover {
      color: #667eea;
      background: rgba(102, 126, 234, 0.08);
    }

    /* EDITOR TOOLBAR */
    .editor-wrapper {
      display: flex;
      flex-direction: column;
      height: 600px;
    }

    .editor-toolbar {
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
      border-bottom: 1px solid rgba(102, 126, 234, 0.1);
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .editor-filename {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
      border-left: 2px solid #667eea;
      padding-left: 1.5rem;
    }

    /* LOADING */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      color: #64748b;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(102, 126, 234, 0.1);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Botón flotante de revisión */
    .btn-review-floating {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .btn-review-floating:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
    }

    .btn-review-floating:active {
      transform: translateY(-2px) scale(1.02);
    }
  `]
})
export class RepositoryComponent implements OnInit {
  repositoryView: RepositoryViewDto | null = null;
  error: string = '';
  projectId: string = '';

	  // File System State
	  currentFolderId: string | null = null;
	  breadcrumbs: Breadcrumb[] = [];
	  files: EvidenceDto[] = [];
	  studentFilesByActivity: StudentFilesByActivityGroup[] = [];

  // Editor State
  editorFile: EvidenceDto | null = null;

	  // Tab State
	  activeTab: 'files' | 'history' = 'files';

  // History State
  history: any[] = [];

  // Review Panel
  @ViewChild('reviewPanel') reviewPanel!: ReviewPanelComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private evidenceService: EvidenceService,
    private dialog: MatDialog,
    private SessionService: SessionService,
    private projectAccessService: ProjectAccessService
  ) { }

  get canCreateContent(): boolean {
    if (this.isGodMode) return false;
    const role = (this.SessionService.getRole() ?? '').toLowerCase();
    return ['colaborador', 'mentor', 'docente', 'professor', 'admin'].includes(role);
  }

  isGodMode: boolean = false;
  isOwner: boolean = false;
  myPermission: ProjectAccessDto | null = null;
  showTeacherAccessPanel: boolean = false;

  get isTeacher(): boolean {
    const role = (this.SessionService.getRole() ?? '').toLowerCase();
    return role === 'docente';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isGodMode = params['mode'] === 'god';
    });

    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      this.loadRepositoryView();
      this.loadFiles();
    });
  }

  loadRepositoryView(): void {
    this.error = '';
    this.projectService.getRepositoryView(this.projectId).subscribe({
      next: (data) => {
        this.repositoryView = data;
        // Detectar si es owner comparando por nombre
        const currentUser = this.SessionService.getUserFromToken();
        this.isOwner = data.header.owner === currentUser?.name;

        // Si no es owner, verificar permisos
        if (!this.isOwner) {
          this.checkMyPermission();
        }
      },
      error: (err) => {
        console.error('Error loading repository:', err);
        this.error = 'No se pudo cargar el repositorio. Verifica que tienes permisos.';
      }
    });
  }

  loadFiles(): void {
    if (this.isTeacher && this.currentFolderId === null) {
      this.evidenceService.getStudentFilesByActivity(this.projectId).subscribe({
        next: (groups) => {
          this.studentFilesByActivity = groups || [];
          this.files = [];
        },
        error: (err) => {
          console.error('Error loading student files by activity', err);
          this.studentFilesByActivity = [];
        }
      });
      return;
    }

    this.studentFilesByActivity = [];
    this.evidenceService.getFiles(this.projectId, this.currentFolderId).subscribe({
      next: (files) => {
        this.files = files;
        // Si estamos en modo God y no hay archivos, mostrar datos de ejemplo
        if (this.isGodMode && files.length === 0) {
          this.loadSampleFiles();
        }
      },
      error: (err) => {
        console.error('Error loading files', err);
        // En modo God, mostrar datos de ejemplo incluso si hay error
        if (this.isGodMode) {
          this.loadSampleFiles();
        }
      }
    });
  }

  loadSampleFiles(): void {
    const now = new Date().toISOString();
    // Datos de ejemplo simplificados para modo God
    // Usamos 'any' temporalmente para evitar problemas de tipo
    const sampleFiles: any[] = [
      {
        id: '1',
        title: 'Documentación del Proyecto',
        description: 'Documento principal con especificaciones',
        isFolder: false,
        mimeType: 'application/pdf',
        author: { id: 1, name: 'Admin', email: 'admin@example.com' },
        createdAt: now,
        updatedAt: now,
        status: 'SUBMITTED',
        type: 'FILE',
        url: null,
        feedback: null,
        contentBlob: null,
        parentId: null
      },
      {
        id: '2',
        title: 'Código Fuente',
        description: 'Repositorio principal del proyecto',
        isFolder: true,
        mimeType: 'application/vnd.promanage.folder',
        author: { id: 2, name: 'Desarrollador', email: 'dev@example.com' },
        createdAt: now,
        updatedAt: now,
        status: 'SUBMITTED',
        type: 'FILE',
        url: null,
        feedback: null,
        contentBlob: null,
        parentId: null
      },
      {
        id: '3',
        title: 'Diseños UI/UX',
        description: 'Mockups y prototipos',
        isFolder: false,
        mimeType: 'image/png',
        author: { id: 3, name: 'Diseñador', email: 'design@example.com' },
        createdAt: now,
        updatedAt: now,
        status: 'APPROVED',
        type: 'FILE',
        url: null,
        feedback: null,
        contentBlob: null,
        parentId: null
      },
      {
        id: '4',
        title: 'Reportes de Pruebas',
        description: 'Resultados de testing QA',
        isFolder: false,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        author: { id: 4, name: 'Tester', email: 'qa@example.com' },
        createdAt: now,
        updatedAt: now,
        status: 'PENDING',
        type: 'FILE',
        url: null,
        feedback: null,
        contentBlob: null,
        parentId: null
      }
    ];
    this.files = sampleFiles;
  }

  checkMyPermission(): void {
    this.projectAccessService.checkMyPermission(this.projectId).subscribe({
      next: (result) => {
        this.myPermission = result.permission || null;
      },
      error: (err) => {
        console.error('Error checking permissions:', err);
        this.myPermission = null;
      }
    });
  }

  toggleTeacherAccessPanel(): void {
    this.showTeacherAccessPanel = !this.showTeacherAccessPanel;
  }

  // Cargar historial con acciones detalladas - SOLO actividad del usuario actual
  loadHistory(): void {
    const currentUser = this.SessionService.getUserFromToken();
    const currentUserId = currentUser?.sub ? Number(currentUser.sub) : null;
    
    this.projectService.getProjectHistory(this.projectId).subscribe({
      next: (logs: any[]) => {
        // Filtrar logs para mostrar solo la actividad del usuario actual
	        const filteredLogs = currentUserId
	          ? logs.filter(log => {
	              // Comparar por ID de usuario (log.user.id o log.userId)
	              const logUserId = log.user?.id || log.userId;
	              if (logUserId !== currentUserId) return false;
	              // Chat eliminado de la UI: ocultar eventos de chat del historial
	              if (log.action === 'CHAT_MESSAGE') return false;
	              return true;
	            })
	          : logs; // Si no hay usuario, mostrar todos (caso de fallback)
        
        // Enriquecer los logs con información más detallada
        this.history = filteredLogs.map(log => ({
          ...log,
          // Agregar iconos y descripciones más específicas
          icon: this.getHistoryIcon(log.action),
          description: this.getHistoryDescription(log)
        }));
      },
      error: (err: any) => console.error('Error loading history', err)
    });
  }

  setActiveTab(tab: 'files' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadHistory();
    }
  }

  getHistoryIconClass(action: string): string {
    switch (action) {
      case 'PROJECT_CREATE': return 'bg-create';
      case 'PROJECT_STATUS_CHANGE': return 'bg-status';
      case 'EVIDENCE_UPLOAD': return 'bg-upload';
      default: return 'bg-default';
    }
  }

  formatAction(action: string): string {
    const map: Record<string, string> = {
      'PROJECT_CREATE': 'Proyecto creado',
      'PROJECT_STATUS_CHANGE': 'Estado cambiado',
      'EVIDENCE_UPLOAD': 'Evidencia subida',
      'SUBMIT_EVIDENCE': 'Evidencia enviada',
	      'REVIEW_EVIDENCE': 'Evidencia revisada',
	      'MILESTONE_CREATE': 'Hito creado',
	      'MILESTONE_COMPLETE': 'Hito completado',
	      'FILE_UPLOAD': 'Archivo subido',
	      'FOLDER_CREATE': 'Carpeta creada'
	    };
    return map[action] || action;
  }

  getHistoryIcon(action: string): string {
    const iconMap: Record<string, string> = {
      'PROJECT_CREATE': '📁',
      'PROJECT_STATUS_CHANGE': '🔄',
      'EVIDENCE_UPLOAD': '📄',
      'SUBMIT_EVIDENCE': '📤',
      'REVIEW_EVIDENCE': '✅',
      'MILESTONE_CREATE': '🎯',
      'MILESTONE_COMPLETE': '🏆',
      'FILE_UPLOAD': '📎',
      'FOLDER_CREATE': '📂'
    };
    return iconMap[action] || '📝';
  }

  getHistoryDescription(log: any): string {
    const action = log.action;
    const metadata = log.metadata || {};
    
    switch (action) {
      case 'PROJECT_CREATE':
        return `Creó el proyecto "${metadata.projectName || 'Nuevo proyecto'}"`;
      case 'PROJECT_STATUS_CHANGE':
        return `Cambió el estado de "${metadata.previousStatus || 'desconocido'}" a "${metadata.newStatus || 'desconocido'}"`;
      case 'EVIDENCE_UPLOAD':
        return `Subió la evidencia "${metadata.evidenceTitle || 'sin título'}"`;
      case 'SUBMIT_EVIDENCE':
        return `Envió evidencia para revisión`;
      case 'REVIEW_EVIDENCE':
        return `Revisó evidencia con resultado: ${metadata.status || 'sin resultado'}`;
      case 'MILESTONE_CREATE':
        return `Creó el hito "${metadata.milestoneTitle || 'sin título'}"`;
      case 'MILESTONE_COMPLETE':
        return `Completó el hito "${metadata.milestoneTitle || 'sin título'}"`;
      case 'FILE_UPLOAD':
        return `Subió el archivo "${metadata.fileName || 'sin nombre'}"`;
      case 'FOLDER_CREATE':
        return `Creó la carpeta "${metadata.folderName || 'sin nombre'}"`;
      default:
        return `Realizó la acción: ${action}`;
    }
  }

  navigateTo(folderId: string | null, name: string): void {
    if (folderId === null) {
      this.breadcrumbs = [];
      this.currentFolderId = null;
    } else {
      const existingIndex = this.breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex !== -1) {
        this.breadcrumbs = this.breadcrumbs.slice(0, existingIndex + 1);
      } else {
        // Handle standard navigation if not clicking breadcrumb
      }
      this.currentFolderId = folderId;
    }
    this.loadFiles();
  }

  onItemClick(file: EvidenceDto): void {
    if (file.isFolder) {
      this.breadcrumbs.push({ id: file.id, name: file.title });
      this.currentFolderId = file.id;
      this.loadFiles();
    } else {
      const mimeType = (file.mimeType || '').toLowerCase();
      const isTextLike =
        !!file.contentBlob ||
        mimeType.startsWith('text/') ||
        mimeType.includes('json') ||
        mimeType.includes('xml');

      if (isTextLike) {
        this.editorFile = file;
      } else {
        this.router.navigate(['/projects', this.projectId, 'evidence', file.id]);
      }
    }
  }

  closeEditor(): void {
    this.editorFile = null;
    this.loadFiles();
  }

  createFolder(): void {
    const name = prompt('Nombre de la nueva carpeta:');
    if (!name) return;

    this.evidenceService.createFolder({
      projectId: this.projectId,
      parentId: this.currentFolderId,
      name
    }).subscribe({
      next: () => this.loadFiles(),
      error: (err) => alert('Error al crear carpeta')
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  // Review Panel Methods
  showReviewPanel = false;

  openReviewPanel(): void {
    this.showReviewPanel = true;
  }

  closeReviewPanel(): void {
    this.showReviewPanel = false;
  }

  openEvidenceDialog(): void {
    const dialogRef = this.dialog.open(EvidenceDialogComponent, {
      width: '520px',
      data: { projectId: this.projectId, parentId: this.currentFolderId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.uploaded) {
        this.loadFiles();
        return;
      }

      if (result) {
        this.createEvidence(result);
      }
    });
  }

  createEvidence(data: CreateEvidenceDto): void {
    const payload = { ...data, parentId: this.currentFolderId };

    this.evidenceService.createEvidence(this.projectId, payload).subscribe({
      next: () => {
        this.loadFiles();
      },
      error: (err) => {
        console.error('Error creating evidence:', err);
        alert('Failed to create evidence. Please try again.');
      }
    });
  }
}


