import { UserRole } from '@/contexts/AuthContext';

export type NotificationRole = UserRole;

export const ROLE_NOTIFICATION_TYPES: Record<NotificationRole, readonly string[]> = {
    STUDENT: ['HOMEWORK_POSTED', 'HOMEWORK_DUE', 'GRADE_POSTED', 'assignment_new', 'assignment_due', 'assignment_graded'],
    FACULTY: ['NEW_SUBMISSION_RECEIVED', 'GRADING_PENDING', 'submission_received', 'course_assigned'],
    ASSISTANT: ['NEW_SUBMISSION_RECEIVED', 'GRADING_PENDING', 'submission_received'],
    ADMIN: ['NEW_USER_REGISTERED', 'COURSE_APPROVAL_REQUIRED', 'SYSTEM_ALERT'],
} as const;

export type NotificationType =
    | 'HOMEWORK_POSTED'
    | 'HOMEWORK_DUE'
    | 'GRADE_POSTED'
    | 'NEW_SUBMISSION_RECEIVED'
    | 'GRADING_PENDING'
    | 'NEW_USER_REGISTERED'
    | 'COURSE_APPROVAL_REQUIRED'
    | 'SYSTEM_ALERT'
    | 'assignment_new'
    | 'assignment_due'
    | 'assignment_graded'
    | 'submission_received'
    | 'course_assigned';

export interface NotificationTypeConfig {
    label: string;
    roles: readonly NotificationRole[];
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
    HOMEWORK_POSTED: { label: 'Assignment Posted', roles: ['STUDENT'] },
    HOMEWORK_DUE: { label: 'Assignment Due', roles: ['STUDENT'] },
    GRADE_POSTED: { label: 'Grade Posted', roles: ['STUDENT'] },
    assignment_new: { label: 'New Assignment', roles: ['STUDENT'] },
    assignment_due: { label: 'Assignment Due', roles: ['STUDENT'] },
    assignment_graded: { label: 'Grade Posted', roles: ['STUDENT'] },
    NEW_SUBMISSION_RECEIVED: { label: 'Submission Received', roles: ['FACULTY', 'ASSISTANT'] },
    GRADING_PENDING: { label: 'Grading Pending', roles: ['FACULTY', 'ASSISTANT'] },
    submission_received: { label: 'Submission Received', roles: ['FACULTY', 'ASSISTANT'] },
    course_assigned: { label: 'Course Assigned', roles: ['FACULTY'] },
    NEW_USER_REGISTERED: { label: 'New User Registered', roles: ['ADMIN'] },
    COURSE_APPROVAL_REQUIRED: { label: 'Course Approval Required', roles: ['ADMIN'] },
    SYSTEM_ALERT: { label: 'System Alert', roles: ['ADMIN'] },
};
