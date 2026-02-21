import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    );
  }

  getDashboard(): Observable<StudentApiResponse<StudentDashboardData>> {
    return this.http.get<StudentApiResponse<StudentDashboardData>>(
      `${this.apiUrl}${API_ROUTES.student.dashboard}`,
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
