import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  count: number;
  details?: string[];
  timestamp?: string;
  priority: number; // 1 = highest, 5 = lowest
}

export interface SystemStats {
  kpis: {
    activeUsers: number;
    activeProjects: number;
    inReview: number;
    storageUsed: number;
  };
  projectStats: {
    draft: number;
    inProgress: number;
    completed: number;
  };
  alerts: SystemAlert[];
}

@Injectable({ providedIn: 'root' })
export class GodAlertsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene estadísticas del sistema para el dashboard de God Mode
   */
  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/admin/dashboard-stats`);
  }

  /**
   * Obtiene alertas pasivas del sistema
   * Estas son alertas que no requieren acción inmediata pero son importantes para monitoreo
   */
  getPassiveAlerts(): Observable<SystemAlert[]> {
    return this.getSystemStats().pipe(
      map(stats => {
        // Generar alertas basadas en las estadísticas del sistema
        const alerts: SystemAlert[] = [];
        
        // 1. Alertas de proyectos inactivos (>30 días)
        if (stats.kpis.activeProjects > 0) {
          // Esto sería calculado por el backend, pero por ahora simulamos
          const inactiveProjects = Math.floor(stats.kpis.activeProjects * 0.1); // 10% inactivos
          if (inactiveProjects > 0) {
            alerts.push({
              id: 'inactive-projects',
              type: 'danger',
              title: 'Proyectos Inactivos (>30 días)',
              description: `${inactiveProjects} proyectos no han tenido actividad reciente`,
              count: inactiveProjects,
              priority: 2
            });
          }
        }

        // 2. Alertas de revisiones estancadas
        if (stats.kpis.inReview > 0) {
          const stuckReviews = Math.floor(stats.kpis.inReview * 0.2); // 20% estancados
          if (stuckReviews > 0) {
            alerts.push({
              id: 'stuck-reviews',
              type: 'warning',
              title: 'Revisiones Estancadas',
              description: `${stuckReviews} revisiones llevan más de 5 días sin resolver`,
              count: stuckReviews,
              priority: 3
            });
          }
        }

        // 3. Alertas de uso de almacenamiento
        if (stats.kpis.storageUsed > 80) {
          alerts.push({
            id: 'storage-high',
            type: 'warning',
            title: 'Alto Uso de Almacenamiento',
            description: `El ${stats.kpis.storageUsed}% del almacenamiento está en uso`,
            count: stats.kpis.storageUsed,
            priority: 2
          });
        }

        // 4. Alertas de proyectos sin progreso
        if (stats.projectStats.draft > 10) {
          alerts.push({
            id: 'many-drafts',
            type: 'info',
            title: 'Muchos Proyectos en Borrador',
            description: `${stats.projectStats.draft} proyectos están en estado borrador`,
            count: stats.projectStats.draft,
            priority: 4
          });
        }

        // 5. Alertas de actividad del sistema
        if (stats.kpis.activeUsers < 5) {
          alerts.push({
            id: 'low-activity',
            type: 'info',
            title: 'Baja Actividad del Sistema',
            description: `Solo ${stats.kpis.activeUsers} usuarios activos`,
            count: stats.kpis.activeUsers,
            priority: 5
          });
        }

        // Ordenar por prioridad (más alta primero)
        return alerts.sort((a, b) => a.priority - b.priority);
      })
    );
  }

  /**
   * Obtiene estadísticas detalladas para mostrar en las tarjetas de alerta
   */
  getAlertStats(): Observable<{
    inactiveProjects: number;
    stuckReviews: number;
    systemActivity: number;
    storageUsage: number;
  }> {
    return this.getSystemStats().pipe(
      map(stats => ({
        inactiveProjects: Math.floor(stats.kpis.activeProjects * 0.1),
        stuckReviews: Math.floor(stats.kpis.inReview * 0.2),
        systemActivity: stats.kpis.activeUsers * 10, // Actividad estimada
        storageUsage: stats.kpis.storageUsed
      }))
    );
  }

  /**
   * Marca una alerta como vista/leída
   */
  markAlertAsRead(alertId: string): Observable<void> {
    // En una implementación real, esto llamaría a un endpoint del backend
    return new Observable(observer => {
      console.log(`Alert ${alertId} marked as read`);
      observer.next();
      observer.complete();
    });
  }

  /**
   * Obtiene el historial de alertas (últimas 24 horas)
   */
  getAlertHistory(): Observable<SystemAlert[]> {
    // Esto sería implementado con un endpoint real
    return new Observable(observer => {
      const mockHistory: SystemAlert[] = [
        {
          id: 'alert-1',
          type: 'warning',
          title: 'Proyecto "Landing Page" sin actividad',
          description: 'El proyecto no ha tenido actividad en 15 días',
          count: 1,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
          priority: 3
        },
        {
          id: 'alert-2',
          type: 'info',
          title: 'Nuevo usuario registrado',
          description: 'Usuario "juan.perez@email.com" se registró',
          count: 1,
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
          priority: 5
        }
      ];
      observer.next(mockHistory);
      observer.complete();
    });
  }
}