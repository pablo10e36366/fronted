import type { ApiResponse } from './api.models';
import type { AssignmentStatus } from './assignment.models';

export type StudentApiResponse<T> = ApiResponse<T>;

export type StudentCourse = {
  id: string;
  name: string;
  code: string | null;
  teacher_name: string | null;
  students_count: number;
  pending_assignments_count: number;
  last_activity_at: string | null;
};

export type StudentCoursesListData = {
  items: StudentCourse[];
};

export type StudentAvailableCourse = StudentCourse & {
  join_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | null;
  join_request_id: string | null;
};

export type StudentAvailableCoursesListData = {
  items: StudentAvailableCourse[];
};

export type StudentJoinCourseResponseData = {
  join_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  join_request_id: string;
};

export type StudentAssignmentListItem = {
  id: string;
  course_id: string;
  course_name: string | null;
  status: AssignmentStatus;
  created_at: string | null;
  submitted_at: string | null;
  due_at: string | null;
  is_late: boolean;
  feedback: string | null;
  review_outcome: 'APPROVED' | 'CHANGES_REQUESTED' | null;
  milestone_id: string | null;
  milestone_title: string | null;
  activity_folder_id: string | null;
  evidence_id: string | null;
  evidence_title: string | null;
};

export type StudentAssignmentsListData = {
  items: StudentAssignmentListItem[];
};

export type StudentTaskListItem = {
  course_id: string;
  course_name: string | null;
  milestone_id: string;
  milestone_title: string;
  due_at: string | null;
  can_submit_until: string | null;
  status: AssignmentStatus;
};

export type StudentDashboardData = {
  pending_total: number;
  overdue_total: number;
  pending_items: StudentTaskListItem[];
  overdue_items: StudentTaskListItem[];
};

export type StudentNotificationItem = {
  id: string;
  type: 'login' | 'teacher_upload' | 'delivery_success';
  title: string;
  course_id: string | null;
  course_name: string | null;
  actor_name: string | null;
  created_at: string;
  deep_link: string | null;
};

export type StudentNotificationsListData = {
  items: StudentNotificationItem[];
};
