'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getAssignmentStatusSummaries } from '@/lib/course-report-utils';
import { AssignmentAttentionBadges } from '@/components/ui/AssignmentAttentionBadges';
import { BackLink } from '@/components/ui/BackLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AcknowledgementPopup } from '@/components/ui/acknowledgement-popup';
import { CourseLoadingPage } from '@/components/course/CourseLoading';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { RubricTemplateEditor, type RubricTemplateData } from '@/components/course/RubricTemplateModal';
import {
    Plus,
    FileText,
    CheckCircle2,
    Clock,
    Search,
    Eye,
    EyeOff,
    Trash2,
    AlertCircle,
    ChevronRight,
    Target,
    RefreshCw,
    BookOpen,
    Pencil,
} from 'lucide-react';

interface RubricTemplateSummary {
    id: number;
    course_id: number;
    title: string;
    description?: string;
    item_count: number;
    total_points: number;
    created_at: string;
}

interface Assignment {
    id: number;
    course_id: number;
    title: string;
    description?: string;
    due_date?: string;
    is_published: boolean;
    max_score: number;
    passing_score: number;
    max_attempts: number;
    allow_late: boolean;
    created_at: string;
    updated_at?: string;
}

interface CourseReport {
    assignments?: { id: number; title: string; due_date?: string | null }[];
    student_reports?: {
        id: number;
        assignment_grades?: {
            assignment_id: number;
            status: 'graded' | 'ungraded' | 'missing' | 'not_submitted';
        }[];
    }[];
}



const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const isOverdue = (dueDate?: string) => dueDate ? new Date(dueDate) < new Date() : false;
const isClosed = (a: Assignment) => !!a.is_published && !!a.due_date && new Date(a.due_date) < new Date();
const isUpcoming = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return due > now && (due.getTime() - now.getTime()) < threeDays;
};

export default function AssignmentsPage() {
    const params = useParams();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canManageRubrics = user?.role === 'FACULTY' || user?.role === 'ADMIN';

    const courseParam = params?.courseId as string | string[] | undefined;
    const courseIdStr = Array.isArray(courseParam) ? (courseParam[0] ?? '') : (courseParam ?? '');
    const courseId = useMemo(() => parseInt(courseIdStr, 10), [courseIdStr]);

    const [activeTab, setActiveTab] = useState<'assignments' | 'rubric-templates'>('assignments');
    const [templateView, setTemplateView] = useState<'list' | 'editor'>('list');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

    // Rubric Templates state
    const [editingTemplate, setEditingTemplate] = useState<{ id: number; data: RubricTemplateData } | null>(null);
    const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<{ id: number; title: string } | null>(null);
    const [notification, setNotification] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
    }>({
        open: false,
        type: 'success',
        title: 'Success',
        message: '',
    });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({
            open: true,
            type,
            title: type === 'success' ? 'Success' : 'Error',
            message,
        });
    };

    const { data: allAssignments = [], isLoading, isFetching, refetch, error: assignmentsError } = useQuery({
        queryKey: ['course-assignments', courseId],
        queryFn: () => apiClient.getCourseAssignments(courseId, true, 'all') as Promise<Assignment[]>,
        enabled: !!courseId && !isNaN(courseId),
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 403 || error?.response?.status === 404) return false;
            return failureCount < 2;
        },
    });

    const { data: courseReport } = useQuery<CourseReport | null>({
        queryKey: ['course-report', courseId],
        queryFn: () => apiClient.getCourseReport(courseId),
        enabled: !!courseId && !isNaN(courseId),
    });

    const assignmentSummaries = useMemo(
        () => getAssignmentStatusSummaries(courseReport),
        [courseReport],
    );
    const assignmentSummaryMap = useMemo(
        () => new Map(assignmentSummaries.map((assignment) => [assignment.assignmentId, assignment])),
        [assignmentSummaries],
    );

    const assignments = useMemo(() => {
        const list = allAssignments as Assignment[];
        if (statusFilter === 'all') return list;
        if (statusFilter === 'published') return list.filter((a) => a.is_published && !isClosed(a));
        if (statusFilter === 'draft') return list.filter((a) => !a.is_published);
        if (statusFilter === 'closed') return list.filter(isClosed);
        return list;
    }, [allAssignments, statusFilter]);

    const publishMutation = useMutation({
        mutationFn: (id: number) => apiClient.publishAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-assignments', courseId] });
            showNotification('success', 'Assignment published!');
        },
        onError: (err: any) => showNotification('error', err.response?.data?.detail || 'Failed to publish'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-assignments', courseId] });
            setDeleteTarget(null);
            showNotification('success', 'Assignment deleted.');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to delete');
        },
    });

    // ── Rubric Templates ──────────────────────────────────────────────────────

    const { data: rubricTemplates = [] } = useQuery<RubricTemplateSummary[]>({
        queryKey: ['rubric-templates', courseId],
        queryFn: () => apiClient.getCourseRubricTemplates(courseId),
        enabled: canManageRubrics && !!courseId && !isNaN(courseId),
    });

    const createTemplateMutation = useMutation({
        mutationFn: (data: RubricTemplateData) => apiClient.createCourseRubricTemplate(courseId, data as unknown as Record<string, unknown>),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubric-templates', courseId] });
            setTemplateView('list');
            showNotification('success', 'Rubric template created!');
        },
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: RubricTemplateData }) =>
            apiClient.updateCourseRubricTemplate(courseId, id, data as unknown as Record<string, unknown>),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubric-templates', courseId] });
            setEditingTemplate(null);
            setTemplateView('list');
            showNotification('success', 'Rubric template updated!');
        },
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteCourseRubricTemplate(courseId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubric-templates', courseId] });
            setDeleteTemplateTarget(null);
            showNotification('success', 'Rubric template deleted.');
        },
        onError: () => showNotification('error', 'Failed to delete template.'),
    });

    const handleOpenEditTemplate = async (tpl: RubricTemplateSummary) => {
        try {
            const full = await apiClient.getCourseRubricTemplate(courseId, tpl.id);
            setEditingTemplate({
                id: tpl.id,
                data: {
                    title: full.title,
                    description: full.description ?? '',
                    items: (full.items ?? []).map((item: { name: string; description?: string; min_scale: number; max_scale: number; points: number; sort_order: number; levels: { score: number; comment: string }[] }) => ({
                        name: item.name,
                        description: item.description ?? '',
                        min_scale: item.min_scale,
                        max_scale: item.max_scale,
                        points: item.points,
                        sort_order: item.sort_order,
                        levels: item.levels ?? [],
                    })),
                },
            });
            setTemplateView('editor');
        } catch {
            showNotification('error', 'Failed to load template for editing.');
        }
    };

    const filteredAssignments = useMemo(() => {
        let result = assignments;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((a: Assignment) => a.title.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q));
        }
        return result;
    }, [assignments, searchQuery]);

    const stats = useMemo(() => {
        const all = allAssignments as Assignment[];
        const closed = all.filter(isClosed);
        const published = all.filter((a) => a.is_published && !isClosed(a));
        const drafts = all.filter((a) => !a.is_published);
        const needsGrading = assignmentSummaries.reduce((sum, assignment) => sum + assignment.ungradedCount, 0);
        const missing = assignmentSummaries.reduce((sum, assignment) => sum + assignment.missingCount, 0);
        return {
            total: all.length,
            published: published.length,
            drafts: drafts.length,
            closed: closed.length,
            overdue: closed.length,
            needsGrading,
            missing,
        };
    }, [allAssignments]);



    const { data: course } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => apiClient.getCourse(courseId) as Promise<{ color?: string | null }>,
        enabled: !!courseId,
    });
    const accentColor = course?.color || '#862733';

    if (isLoading) {
        return <CourseLoadingPage message="Loading assignments..." />;
    }

    if (assignmentsError) {
        const status = (assignmentsError as any)?.response?.status;
        const detail = (assignmentsError as any)?.response?.data?.detail;
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {status === 403 ? 'Access Denied' : 'Failed to Load Assignments'}
                </h2>
                <p className="text-gray-500 max-w-sm mb-6">
                    {typeof detail === 'string' ? detail : status === 403 ? 'You are not authorized to view assignments for this course.' : 'An error occurred while loading assignments.'}
                </p>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 pb-8">

                {/* ─── Tab Bar ─── */}
                <div className="flex items-center gap-1 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('assignments')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            activeTab === 'assignments'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Assignments
                        {stats.total > 0 && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">
                                {stats.total}
                            </span>
                        )}
                    </button>
                    {canManageRubrics && (
                        <button
                            type="button"
                            onClick={() => { setActiveTab('rubric-templates'); setTemplateView('list'); }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                activeTab === 'rubric-templates'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Rubric Templates
                            {rubricTemplates.length > 0 && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700">
                                    {rubricTemplates.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* ─── Assignments Tab ─── */}
                {activeTab === 'assignments' && (
                    <>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link href={`/faculty/courses/${courseId}/assignments/new`}>
                                <Button className="gap-2 h-9 text-white" style={{ backgroundColor: accentColor }}>
                                    <Plus className="w-4 h-4" /> New Assignment
                                </Button>
                            </Link>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('all')}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                                            <FileText className="w-5 h-5" style={{ color: accentColor }} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                            <p className="text-xs text-gray-500">Total</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('published')}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                                            <Eye className="w-5 h-5" style={{ color: accentColor }} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                                            <p className="text-xs text-gray-500">Published</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('draft')}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                                            <EyeOff className="w-5 h-5" style={{ color: accentColor }} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{stats.drafts}</p>
                                            <p className="text-xs text-gray-500">Drafts</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('closed')}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                                            <AlertCircle className="w-5 h-5" style={{ color: accentColor }} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                                            <p className="text-xs text-gray-500">Closed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search & Filter */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search assignments..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <select
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'closed')}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Drafts</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                {(searchQuery || statusFilter !== 'all') && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                        <span>Showing {filteredAssignments.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
                                        <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="text-primary hover:underline">Clear</button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assignment Cards */}
                        {filteredAssignments.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                                        {assignments.length === 0 ? 'No assignments yet' : 'No matching assignments'}
                                    </h3>
                                    <p className="text-gray-500 mb-6 text-sm">
                                        {assignments.length === 0
                                            ? 'Create your first assignment to get started.'
                                            : 'Try adjusting your search or filter.'}
                                    </p>
                                    {assignments.length === 0 && (
                                        <Link href={`/faculty/courses/${courseId}/assignments/new`}>
                                            <Button className="gap-2">
                                                <Plus className="w-4 h-4" /> Create First Assignment
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                                {filteredAssignments.map((a: Assignment) => {
                                    const overdue = a.is_published && isOverdue(a.due_date);
                                    const upcoming = a.is_published && isUpcoming(a.due_date);

                                    return (
                                        <Card key={a.id} className="hover:shadow-md transition-all group">
                                            <CardContent className="p-0">
                                                <div className="flex items-stretch">
                                                    <div className={`w-1.5 flex-shrink-0 rounded-l-lg ${a.is_published
                                                            ? overdue ? 'bg-red-500' : upcoming ? 'bg-amber-400' : 'bg-green-500'
                                                            : 'bg-gray-300'
                                                        }`} />
                                                    <Link
                                                        href={`/faculty/courses/${courseId}/assignments/${a.id}`}
                                                        className="flex-1 p-4 md:p-5 hover:bg-gray-50/50 transition-colors"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                                                                        {a.title}
                                                                    </h3>
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${a.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {a.is_published ? 'Published' : 'Draft'}
                                                                    </span>
                                                                    {overdue && (
                                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">
                                                                            Past Due
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {a.description && (
                                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{a.description}</p>
                                                                )}
                                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <Target className="w-3.5 h-3.5" /> {a.max_score} pts
                                                                    </span>
                                                                    {a.max_attempts > 0 && (
                                                                        <span className="flex items-center gap-1">
                                                                            <RefreshCw className="w-3.5 h-3.5" /> {a.max_attempts} attempts
                                                                        </span>
                                                                    )}
                                                                    {a.allow_late && (
                                                                        <span className="flex items-center gap-1 text-amber-600">
                                                                            <Clock className="w-3.5 h-3.5" /> Late OK
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                                {a.due_date && (
                                                                    <div className="text-right hidden sm:block">
                                                                        <p className="text-xs text-gray-400">Due</p>
                                                                        <p className={`text-sm font-medium ${overdue ? 'text-red-600' : upcoming ? 'text-amber-600' : 'text-gray-700'}`}>
                                                                            {formatDate(a.due_date)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                    <div className="flex flex-col justify-center gap-1 px-3 border-l border-gray-100">
                                                        {!a.is_published ? (
                                                            <button
                                                                onClick={() => publishMutation.mutate(a.id)}
                                                                disabled={publishMutation.isPending}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Publish"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button className="p-2 text-gray-400 rounded-lg cursor-default" title="Published">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: a.id, title: a.title })}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ─── Rubric Templates Tab ─── */}
                {activeTab === 'rubric-templates' && canManageRubrics && (
                    <>
                        {templateView === 'editor' ? (
                            <Card>
                                <CardContent className="p-6">
                                    <RubricTemplateEditor
                                        title={editingTemplate ? 'Edit Rubric Template' : 'Create Rubric Template'}
                                        initialData={editingTemplate?.data}
                                        isSaving={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                                        onCancel={() => { setTemplateView('list'); setEditingTemplate(null); }}
                                        onSave={async (data) => {
                                            if (editingTemplate) {
                                                await updateTemplateMutation.mutateAsync({ id: editingTemplate.id, data });
                                            } else {
                                                await createTemplateMutation.mutateAsync(data);
                                            }
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Rubric Templates</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Reusable grading rubrics — create once, apply to any assignment</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => { setEditingTemplate(null); setTemplateView('editor'); }}
                                        className="h-9 gap-2 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <Plus className="w-4 h-4" /> New Template
                                    </Button>
                                </div>

                                {rubricTemplates.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-16 text-center">
                                            <BookOpen className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No rubric templates yet</h3>
                                            <p className="text-gray-500 mb-6 text-sm">Create a template once, reuse it across assignments.</p>
                                            <Button
                                                type="button"
                                                onClick={() => { setEditingTemplate(null); setTemplateView('editor'); }}
                                                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                <Plus className="w-4 h-4" /> Create First Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {rubricTemplates.map((tpl) => (
                                            <Card key={tpl.id} className="hover:shadow-md hover:border-indigo-200 transition-all">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">{tpl.title}</p>
                                                            {tpl.description && (
                                                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{tpl.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditTemplate(tpl)}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTemplateTarget({ id: tpl.id, title: tpl.title })}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
                                                            {tpl.item_count} criteria
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1 font-medium">
                                                            {tpl.total_points} pts
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Delete confirmation modal */}
                <ConfirmDeleteModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                    confirmationPhrase="Delete this Assignment"
                    itemName={deleteTarget?.title}
                    title="Delete Assignment"
                    description={
                        deleteTarget
                            ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone. Type "Delete this Assignment" to confirm.`
                            : undefined
                    }
                    isLoading={deleteMutation.isPending}
                />

                {/* Background refresh indicator */}
                {isFetching && !isLoading && (
                    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm text-gray-600 border">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        Updating...
                    </div>
                )}
            </div>

            <AcknowledgementPopup
                isOpen={notification.open}
                onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />

            {/* Delete Template Confirmation */}
            <ConfirmDeleteModal
                isOpen={!!deleteTemplateTarget}
                onClose={() => setDeleteTemplateTarget(null)}
                onConfirm={() => deleteTemplateTarget && deleteTemplateMutation.mutate(deleteTemplateTarget.id)}
                confirmationPhrase="Delete this Template"
                itemName={deleteTemplateTarget?.title}
                title="Delete Rubric Template"
                description={
                    deleteTemplateTarget
                        ? `Are you sure you want to delete "${deleteTemplateTarget.title}"? This cannot be undone. Type "Delete this Template" to confirm.`
                        : undefined
                }
                isLoading={deleteTemplateMutation.isPending}
            />
        </>
    );
}
