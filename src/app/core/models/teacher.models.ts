import type { ApiMeta, ApiResponse } from './api.models';

export type TeacherApiMeta = ApiMeta;

export type TeacherApiResponse<T> = ApiResponse<T>;

export type TeacherBadges = {
  submissions_pending: number;
  threads_unanswered: number;
  alerts: number;
};

export type TeacherCourse = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  students_count: number;
  pending_submissions_count: number;
  unanswered_threads_count: number;
  last_activity_at: string | null;
};

export type TeacherSubmissionListItem = {
  id: string;
  course_id: string;
  course_name: string;
  student_id: number;
  student_name: string;
  student_email: string;
  title: string;
  milestone_id?: string | null;
  milestone_title?: string | null;
  status: 'pending' | 'approved' | 'changes_requested';
  priority: 'high' | 'medium' | 'low';
  created_at: string | null;
  submitted_at: string | null;
  due_at: string | null;
  is_late: boolean;
  evidence_id: string | null;
  deep_link: string;
};

export type TeacherSubmissionsListData = {
  items: TeacherSubmissionListItem[];
  next_pending_submission_id: string | null;
};

export type TeacherSubmissionDetail = {
  id: string;
  course_id: string;
  course_name: string;
  student_id: number;
  student_name: string;
  student_email: string;
  evidence_id: string | null;
  evidence_title: string | null;
  status: 'pending' | 'approved' | 'changes_requested';
  feedback: string;
  student_comment?: string | null;
  student_links?: string[];
  due_at: string | null;
  submitted_at: string | null;
  created_at: string | null;
  is_late: boolean;
};

export type ReviewSubmissionRequest = {
  status: 'approved' | 'changes_requested';
  feedback: string;
  rubric_scores?: Record<string, number> | null;
};

export type TeacherDashboardItem = {
  type: 'submission' | 'thread' | 'alert';
  id: string;
  course_id: string;
  course_name: string;
  student_name?: string;
  title: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string | null;
  due_at: string | null;
  deep_link: string;
};

export type TeacherDashboardData = {
  summary: {
    pending_submissions: number;
    unanswered_threads: number;
    overdue_items: number;
  };
  overdue_items: TeacherDashboardItem[];
  today_items: TeacherDashboardItem[];
};

export type TeacherActivityFeedEvent = {
  id: string;
  type: string;
  course_id: string;
  actor_type: string;
  actor_name: string | null;
  entity_id: string | null;
  title: string | null;
  created_at: string | null;
  metadata: any;
};

export type TeacherThreadsListItem = {
  id: string;
  course_id: string;
  course_name: string;
  author_id: number;
  author_name: string;
  title: string;
  status: 'unanswered' | 'answered';
  created_at: string | null;
  deep_link: string;
};

export type TeacherThreadReply = {
  id: string;
  author_id: number;
  author_name: string;
  message: string;
  created_at: string | null;
};

export type TeacherThreadDetail = {
  id: string;
  course_id: string;
  course_name: string;
  author_id: number;
  author_name: string;
  title: string;
  message: string;
  status: 'unanswered' | 'answered';
  created_at: string | null;
  replies: TeacherThreadReply[];
};

export type TeacherNotificationItem = {
  id: string;
  type: 'login' | 'student_submission' | 'join_request';
  title: string;
  course_id: string | null;
  course_name: string | null;
  actor_name: string | null;
  created_at: string;
  deep_link: string | null;
};

export type TeacherNotificationsListData = {
  items: TeacherNotificationItem[];
};
