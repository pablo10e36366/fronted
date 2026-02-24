import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/api.routes';
import type {
  ReviewSubmissionRequest,
  TeacherActivityFeedEvent,
  TeacherApiResponse,
  TeacherBadges,
  TeacherCourse,
  TeacherDashboardData,
  TeacherNotificationsListData,
  TeacherSubmissionDetail,
  TeacherSubmissionsListData,
  TeacherThreadDetail,
  TeacherThreadsListItem,
} from '../../../core/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private shouldUseReadFallback(error: HttpErrorResponse): boolean {
    if (error.status === 401 || error.status === 403) return false;
    return error.status === 400 || error.status >= 500;
  }

  private emptyListMeta(page = 1, page_size = 10) {
    return { page, page_size, total: 0 };
  }

  getBadges(): Observable<TeacherApiResponse<TeacherBadges>> {
    return this.http.get<TeacherApiResponse<TeacherBadges>>(`${this.apiUrl}${API_ROUTES.teacher.badges}`);
  }

  getDashboard(): Observable<TeacherApiResponse<TeacherDashboardData>> {
    return this.http
      .get<TeacherApiResponse<TeacherDashboardData>>(`${this.apiUrl}${API_ROUTES.teacher.dashboard}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (!this.shouldUseReadFallback(error)) {
            return throwError(() => error);
          }

          return of({
            data: {
              summary: {
                pending_submissions: 0,
                unanswered_threads: 0,
                overdue_items: 0,
              },
              overdue_items: [],
              today_items: [],
            },
          });
        }),
      );
  }

  getNotifications(params?: {
    page?: number;
    page_size?: number;
  }): Observable<TeacherApiResponse<TeacherNotificationsListData>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);

    return this.http.get<TeacherApiResponse<TeacherNotificationsListData>>(
      `${this.apiUrl}${API_ROUTES.teacher.notifications}`,
      { params: httpParams },
    );
  }

  getCourses(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    sort?: string;
  }): Observable<TeacherApiResponse<{ items: TeacherCourse[] }>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<TeacherApiResponse<{ items: TeacherCourse[] }>>(
      `${this.apiUrl}${API_ROUTES.teacher.courses}`,
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

  getCourseById(courseId: string): Observable<TeacherApiResponse<TeacherCourse>> {
    return this.http.get<TeacherApiResponse<TeacherCourse>>(
      `${this.apiUrl}${API_ROUTES.teacher.course(courseId)}`,
    );
  }

  createCourse(body: { name: string; code?: string; description?: string | null }): Observable<TeacherApiResponse<TeacherCourse>> {
    return this.http.post<TeacherApiResponse<TeacherCourse>>(`${this.apiUrl}${API_ROUTES.teacher.courses}`, body);
  }

  deleteCourse(courseId: string): Observable<TeacherApiResponse<{ deleted: true }>> {
    return this.http.delete<TeacherApiResponse<{ deleted: true }>>(
      `${this.apiUrl}${API_ROUTES.teacher.course(courseId)}`,
    );
  }

  getSubmissions(params?: {
    status?: string;
    course_id?: string;
    student_id?: number | string;
    q?: string;
    sort?: string;
    include_unsubmitted?: boolean;
    page?: number;
    page_size?: number;
  }): Observable<TeacherApiResponse<TeacherSubmissionsListData>> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.course_id) httpParams = httpParams.set('course_id', params.course_id);
    if (params?.student_id) httpParams = httpParams.set('student_id', params.student_id);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (typeof params?.include_unsubmitted === 'boolean') {
      httpParams = httpParams.set('include_unsubmitted', String(params.include_unsubmitted));
    }
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);

    return this.http.get<TeacherApiResponse<TeacherSubmissionsListData>>(
      `${this.apiUrl}${API_ROUTES.teacher.submissions}`,
      { params: httpParams },
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldUseReadFallback(error)) {
          return throwError(() => error);
        }

        return of({
          data: {
            items: [],
            next_pending_submission_id: null,
          },
          meta: this.emptyListMeta(params?.page || 1, params?.page_size || 10),
        });
      }),
    );
  }

  getSubmission(id: string): Observable<TeacherApiResponse<TeacherSubmissionDetail>> {
    return this.http.get<TeacherApiResponse<TeacherSubmissionDetail>>(`${this.apiUrl}${API_ROUTES.teacher.submission(id)}`);
  }

  reviewSubmission(id: string, body: ReviewSubmissionRequest): Observable<TeacherApiResponse<TeacherSubmissionDetail>> {
    return this.http.patch<TeacherApiResponse<TeacherSubmissionDetail>>(`${this.apiUrl}${API_ROUTES.teacher.submission(id)}`, body);
  }

  getNextSubmission(
    id: string,
    params?: { course_id?: string; student_id?: number | string; q?: string },
  ): Observable<TeacherApiResponse<{ next_id: string | null }>> {
    let httpParams = new HttpParams();
    if (params?.course_id) httpParams = httpParams.set('course_id', params.course_id);
    if (params?.student_id) httpParams = httpParams.set('student_id', params.student_id);
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<TeacherApiResponse<{ next_id: string | null }>>(
      `${this.apiUrl}${API_ROUTES.teacher.submissionNext(id)}`,
      { params: httpParams },
    );
  }

  getCourseActivityFeed(
    courseId: string,
    params?: { page?: number; page_size?: number; type?: string },
  ): Observable<TeacherApiResponse<{ items: TeacherActivityFeedEvent[] }>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params?.type) httpParams = httpParams.set('type', params.type);

    return this.http.get<TeacherApiResponse<{ items: TeacherActivityFeedEvent[] }>>(
      `${this.apiUrl}${API_ROUTES.teacher.courseActivityFeed(courseId)}`,
      { params: httpParams },
    );
  }

  createCourseActivity(
    courseId: string,
    body: { title: string; description?: string | null; type?: string | null; deadline?: string | null },
  ): Observable<
    TeacherApiResponse<{
      milestone_id: string;
      folder_id: string;
      assignments_created: number;
      deadline?: string | null;
    }>
  > {
    return this.http.post<
      TeacherApiResponse<{
        milestone_id: string;
        folder_id: string;
        assignments_created: number;
        deadline?: string | null;
      }>
    >(
      `${this.apiUrl}${API_ROUTES.teacher.createCourseActivity(courseId)}`,
      body,
    );
  }

  deleteCourseActivity(
    courseId: string,
    activityId: string,
  ): Observable<TeacherApiResponse<{ deleted: true; removed_assignments: number }>> {
    return this.http.delete<TeacherApiResponse<{ deleted: true; removed_assignments: number }>>(
      `${this.apiUrl}${API_ROUTES.teacher.deleteCourseActivity(courseId, activityId)}`,
    );
  }

  getThreads(params?: {
    status?: string;
    course_id?: string;
    q?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  }): Observable<TeacherApiResponse<{ items: TeacherThreadsListItem[] }>> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.course_id) httpParams = httpParams.set('course_id', params.course_id);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size);

    return this.http.get<TeacherApiResponse<{ items: TeacherThreadsListItem[] }>>(
      `${this.apiUrl}${API_ROUTES.teacher.threads}`,
      { params: httpParams },
    );
  }

  getThread(id: string): Observable<TeacherApiResponse<TeacherThreadDetail>> {
    return this.http.get<TeacherApiResponse<TeacherThreadDetail>>(`${this.apiUrl}${API_ROUTES.teacher.thread(id)}`);
  }

  replyThread(id: string, message: string): Observable<TeacherApiResponse<TeacherThreadDetail>> {
    return this.http.post<TeacherApiResponse<TeacherThreadDetail>>(`${this.apiUrl}${API_ROUTES.teacher.threadReplies(id)}`, { message });
  }

  updateThreadStatus(id: string, status: 'answered' | 'unanswered'): Observable<TeacherApiResponse<TeacherThreadDetail>> {
    return this.http.patch<TeacherApiResponse<TeacherThreadDetail>>(`${this.apiUrl}${API_ROUTES.teacher.thread(id)}`, { status });
  }
}
