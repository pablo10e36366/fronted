import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/api.routes';
import type {
  StudentApiResponse,
  StudentAssignmentsListData,
  StudentAvailableCoursesListData,
  StudentCoursesListData,
  StudentDashboardData,
  StudentJoinCourseResponseData,
  StudentNotificationsListData,
  StudentRoleUpgradeRequestData,
} from '../../../core/models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private shouldUseReadFallback(error: HttpErrorResponse): boolean {
    // Mantener seguridad de sesión: no ocultar errores de auth/autorización.
    if (error.status === 401 || error.status === 403) return false;
    // Backend actual puede responder 400 o 500 por incompatibilidad de esquema.
    return error.status === 400 || error.status >= 500;
  }

  private emptyListMeta(page = 1, page_size = 10) {
    return { page, page_size, total: 0 };
  }

  getCourses(params?: {
    page?: number;
    page_size?: number;
    q?: string;
  }): Observable<StudentApiResponse<StudentCoursesListData>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<StudentApiResponse<StudentCoursesListData>>(
      `${this.apiUrl}${API_ROUTES.student.courses}`,
      { params: httpParams },
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldUseReadFallback(error)) {
          return throwError(() => error);
        }
        return of({
          data: { items: [] },
          meta: this.emptyListMeta(params?.page || 1, params?.page_size || 10),
        });
      }),
    );
  }

  getAvailableCourses(params?: {
    page?: number;
    page_size?: number;
    q?: string;
  }): Observable<StudentApiResponse<StudentAvailableCoursesListData>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<StudentApiResponse<StudentAvailableCoursesListData>>(
      `${this.apiUrl}${API_ROUTES.student.coursesAvailable}`,
      { params: httpParams },
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldUseReadFallback(error)) {
          return throwError(() => error);
        }
        return of({
          data: { items: [] },
          meta: this.emptyListMeta(params?.page || 1, params?.page_size || 10),
        });
      }),
    );
  }

  joinCourse(courseId: string): Observable<StudentApiResponse<StudentJoinCourseResponseData>> {
    return this.http.post<StudentApiResponse<StudentJoinCourseResponseData>>(
      `${this.apiUrl}${API_ROUTES.student.courseJoin(courseId)}`,
      {},
    );
  }

  getAssignments(params?: {
    page?: number;
    page_size?: number;
    course_id?: string;
    status?: string;
    q?: string;
    sort?: string;
  }): Observable<StudentApiResponse<StudentAssignmentsListData>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params?.course_id) httpParams = httpParams.set('course_id', params.course_id);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<StudentApiResponse<StudentAssignmentsListData>>(
      `${this.apiUrl}${API_ROUTES.student.assignments}`,
      { params: httpParams },
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldUseReadFallback(error)) {
          return throwError(() => error);
        }
        return of({
          data: { items: [] },
          meta: this.emptyListMeta(params?.page || 1, params?.page_size || 10),
        });
      }),
    );
  }

  getDashboard(): Observable<StudentApiResponse<StudentDashboardData>> {
    return this.http
      .get<StudentApiResponse<StudentDashboardData>>(`${this.apiUrl}${API_ROUTES.student.dashboard}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (!this.shouldUseReadFallback(error)) {
            return throwError(() => error);
          }

          // Fallback defensivo: algunos despliegues responden 400 en /student/dashboard.
          // Armamos el dashboard a partir de assignments para no romper la pantalla.
          return this.getAssignments({ page: 1, page_size: 200, status: 'PENDIENTE' }).pipe(
            map((res) => {
              const now = Date.now();
              const pending_items = (res.data?.items || [])
                .filter((item) => item.status === 'PENDIENTE')
                .map((item) => ({
                  course_id: item.course_id,
                  course_name: item.course_name,
                  milestone_id: item.milestone_id || item.id,
                  milestone_title: item.milestone_title || 'Actividad pendiente',
                  due_at: item.due_at,
                  can_submit_until: item.due_at,
                  status: item.status,
                }));

              const overdue_items = pending_items.filter(
                (item) => !!item.due_at && new Date(item.due_at).getTime() < now,
              );
              const current_pending = pending_items.filter(
                (item) => !item.due_at || new Date(item.due_at).getTime() >= now,
              );

              return {
                data: {
                  pending_total: current_pending.length,
                  overdue_total: overdue_items.length,
                  pending_items: current_pending,
                  overdue_items,
                },
              };
            }),
            catchError(() =>
              of({
                data: {
                  pending_total: 0,
                  overdue_total: 0,
                  pending_items: [],
                  overdue_items: [],
                },
              }),
            ),
          );
        }),
      );
  }

  getNotifications(params?: {
    page?: number;
    page_size?: number;
  }): Observable<StudentApiResponse<StudentNotificationsListData>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);

    return this.http.get<StudentApiResponse<StudentNotificationsListData>>(
      `${this.apiUrl}${API_ROUTES.student.notifications}`,
      { params: httpParams },
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldUseReadFallback(error)) {
          return throwError(() => error);
        }
        return of({
          data: { items: [] },
          meta: this.emptyListMeta(params?.page || 1, params?.page_size || 10),
        });
      }),
    );
  }

  getTeacherRoleRequest(): Observable<StudentApiResponse<StudentRoleUpgradeRequestData>> {
    return this.http.get<StudentApiResponse<StudentRoleUpgradeRequestData>>(
      `${this.apiUrl}${API_ROUTES.student.teacherRoleRequest}`,
    );
  }

  createTeacherRoleRequest(
    message?: string,
  ): Observable<StudentApiResponse<StudentRoleUpgradeRequestData>> {
    return this.http.post<StudentApiResponse<StudentRoleUpgradeRequestData>>(
      `${this.apiUrl}${API_ROUTES.student.teacherRoleRequest}`,
      { message: message?.trim() || undefined },
    );
  }
}
