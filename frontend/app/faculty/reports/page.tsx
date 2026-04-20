'use client';

import { useMemo, useState } from 'react';
import { InnerHeaderDesign } from '@/components/InnerHeaderDesign';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getAssignmentStatusSummaries, getStudentIdsMatchingStatuses } from '@/lib/course-report-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import {
    Download,
    Users,
    FileCode,
    BookOpen,
    Clock,
    AlertCircle,
    TrendingUp,
    XCircle,
    FileDown,
} from 'lucide-react';

type FacultyCourse = {
    id: number;
    code: string;
    name: string;
};

type CourseReport = {
    course: {
        id: number;
        code: string;
        name: string;
        semester?: string | null;
        year?: number | null;
    };
    total_students: number;
    total_assignments: number;
    total_submissions: number;
    course_average_score?: number | null;
    assignments?: {
        id: number;
        title: string;
        max_score: number;
        due_date?: string | null;
    }[];
    student_reports?: {
        id: number;
        name: string;
        email: string;
        student_id?: string | null;
        average_score?: number | null;
        completed_assignments: number;
        total_assignments: number;
        assignment_grades?: {
            assignment_id: number;
            assignment_title: string;
            score?: number | null;
            max_score?: number;
            status: 'graded' | 'ungraded' | 'missing' | 'not_submitted';
            submitted_at?: string | null;
        }[];
    }[];
};

const STATUS_CONFIG = {
    graded:        { label: 'Graded',       cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ungraded:      { label: 'Ungraded',     cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    missing:       { label: 'Missing',      cls: 'bg-red-100 text-red-700 border-red-200' },
    not_submitted: { label: 'Unsubmitted',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
} as const;

export default function FacultyReportsPage() {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);

    const { data: courses = [], isLoading: loadingCourses } = useQuery<FacultyCourse[]>({
        queryKey: ['faculty-courses'],
        queryFn: () => apiClient.getFacultyCourses(),
    });

    const effectiveCourseId = selectedCourseId ?? (courses[0]?.id ?? null);

    const { data: courseReport, isLoading: loadingReport } = useQuery<CourseReport | null>({
        queryKey: ['course-report', effectiveCourseId],
        enabled: !!effectiveCourseId,
        queryFn: () =>
            effectiveCourseId ? apiClient.getCourseReport(effectiveCourseId) : Promise.resolve(null),
    });

    const isLoading = loadingCourses || loadingReport;
    const currentCourse = useMemo(
        () => courses.find((c) => c.id === effectiveCourseId) || null,
        [courses, effectiveCourseId],
    );

    const assignmentOptions = courseReport?.assignments ?? [];
    const studentOptions = courseReport?.student_reports ?? [];

    const selectedAssignments = useMemo(
        () => assignmentOptions.filter((a) => selectedAssignmentIds.includes(a.id)),
        [assignmentOptions, selectedAssignmentIds],
    );
    const selectedStudents = useMemo(
        () => studentOptions.filter((s) => selectedStudentIds.includes(s.id)),
        [studentOptions, selectedStudentIds],
    );

    const areAllStudentsSelected = studentOptions.length > 0 && selectedStudentIds.length === studentOptions.length;
    const areAllAssignmentsSelected = assignmentOptions.length > 0 && selectedAssignmentIds.length === assignmentOptions.length;
    const shouldShowSelectedReport = selectedStudentIds.length > 0 && selectedAssignmentIds.length > 0;

    const assignmentSummaries = useMemo(() => getAssignmentStatusSummaries(courseReport), [courseReport]);
    const totalNeedsGrading = useMemo(
        () => assignmentSummaries.reduce((sum, a) => sum + a.ungradedCount, 0),
        [assignmentSummaries],
    );
    const totalMissingSubmissions = useMemo(
        () => assignmentSummaries.reduce((sum, a) => sum + a.missingCount, 0),
        [assignmentSummaries],
    );
    const assignmentSummaryMap = useMemo(
        () => new Map(assignmentSummaries.map((a) => [a.assignmentId, a])),
        [assignmentSummaries],
    );

    const getGradeForAssignment = (
        student: NonNullable<CourseReport['student_reports']>[number],
        assignmentId: number,
    ) => student.assignment_grades?.find((g) => g.assignment_id === assignmentId) ?? null;

    const overallAverage = courseReport?.course_average_score ?? null;

    const handleDownloadStudentCSV = (
        student: NonNullable<CourseReport['student_reports']>[number],
    ) => {
        const course = courseReport?.course;
        const assignments = selectedAssignments.length > 0 ? selectedAssignments : assignmentOptions;
        const scores = assignments
            .map((a) => getGradeForAssignment(student, a.id)?.score)
            .filter((v): v is number => typeof v === 'number');
        const average = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
        const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const labelMap: Record<string, string> = {
            graded: 'Graded', ungraded: 'Ungraded', missing: 'Missing', not_submitted: 'Unsubmitted',
        };

        const headers = ['Assignment', 'Total Points', 'Score', 'Status'];
        const rows = assignments.map((a) => {
            const grade = getGradeForAssignment(student, a.id);
            const score = grade?.score != null ? grade.score.toFixed(1) : '';
            const status = grade ? (labelMap[grade.status] ?? grade.status) : 'Unsubmitted';
            return [`"${a.title}"`, a.max_score, score, `"${status}"`].join(',');
        });
        const avgRow = [`"Overall Average"`, '', average != null ? average.toFixed(1) + '%' : '', ''].join(',');

        const csv = [headers.join(','), ...rows, avgRow].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grade_report_${student.name.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCourseReport = async () => {
        if (!effectiveCourseId) return;
        try {
            const blob = await apiClient.exportCourseReport(
                effectiveCourseId,
                selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
                selectedAssignmentIds.length > 0 ? selectedAssignmentIds : undefined,
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `course_report_${courseReport?.course.code || effectiveCourseId}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            // eslint-disable-next-line no-alert
            alert('Failed to download report. Please try again.');
        }
    };

    const applyQuickFilter = (status: 'ungraded' | 'missing') => {
        const matchingAssignmentIds = assignmentSummaries
            .filter((a) => status === 'ungraded' ? a.ungradedCount > 0 : a.missingCount > 0)
            .map((a) => a.assignmentId);
        const matchingStudentIds = getStudentIdsMatchingStatuses(courseReport, matchingAssignmentIds, [status]);
        setSelectedAssignmentIds(matchingAssignmentIds);
        setSelectedStudentIds(matchingStudentIds);
    };

    const clearSelections = () => {
        setSelectedStudentIds([]);
        setSelectedAssignmentIds([]);
    };

    return (
        <div className="space-y-6">
            <InnerHeaderDesign
                title="Course performance"
                subtitle={
                    currentCourse
                        ? `${currentCourse.code} · ${currentCourse.name}`
                        : 'Choose a course to see live performance analytics'
                }
                actions={
                    <Button
                        onClick={handleDownloadCourseReport}
                        disabled={!effectiveCourseId || isLoading}
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    >
                        <FileCode className="w-4 h-4 mr-2" />
                        Download report
                    </Button>
                }
            />

            {/* Course selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent min-w-[220px]"
                            value={effectiveCourseId ?? ''}
                            onChange={(e) => {
                                setSelectedCourseId(Number(e.target.value) || null);
                                setSelectedStudentIds([]);
                                setSelectedAssignmentIds([]);
                            }}
                        >
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} · {c.name}
                                </option>
                            ))}
                        </select>
                        {currentCourse && (
                            <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">{currentCourse.code}</span>
                                {courseReport?.course.semester && ` · ${courseReport.course.semester} ${courseReport.course.year ?? ''}`}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Students', value: courseReport?.total_students ?? '—', icon: Users, bg: 'bg-indigo-50', iconCls: 'text-indigo-600' },
                    { label: 'Assignments', value: courseReport?.total_assignments ?? '—', icon: BookOpen, bg: 'bg-violet-50', iconCls: 'text-violet-600' },
                    {
                        label: 'Course Average',
                        value: overallAverage != null ? `${overallAverage.toFixed(1)}%` : '—',
                        icon: TrendingUp,
                        bg: 'bg-emerald-50',
                        iconCls: 'text-emerald-600',
                    },
                    {
                        label: 'Needs Grading',
                        value: totalNeedsGrading,
                        icon: Clock,
                        bg: totalNeedsGrading > 0 ? 'bg-amber-50' : 'bg-gray-50',
                        iconCls: totalNeedsGrading > 0 ? 'text-amber-600' : 'text-gray-400',
                    },
                ].map(({ label, value, icon: Icon, bg, iconCls }) => (
                    <Card key={label} className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                                <Icon className={`w-4 h-4 ${iconCls}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Assignment overview */}
            {assignmentSummaries.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Assignment overview</CardTitle>
                        <CardDescription>Status breakdown per assignment</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="text-left px-5 py-3 font-medium text-gray-600">Assignment</th>
                                    <th className="text-center px-4 py-3 font-medium text-emerald-700">Graded</th>
                                    <th className="text-center px-4 py-3 font-medium text-blue-700">Ungraded</th>
                                    <th className="text-center px-4 py-3 font-medium text-red-600">Missing</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-500">Unsubmitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assignmentSummaries.map((s) => (
                                    <tr key={s.assignmentId} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-800">{s.title}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-block min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                {s.gradedCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s.ungradedCount > 0 ? (
                                                <span className="inline-block min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                    {s.ungradedCount}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s.missingCount > 0 ? (
                                                <span className="inline-block min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                                                    {s.missingCount}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-gray-400">{s.notSubmittedCount}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Grade report filters */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Grade report</CardTitle>
                    <CardDescription>
                        Filter by students and assignments. Leave empty to include all.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-800">Students</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {selectedStudentIds.length} selected
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                    areAllStudentsSelected
                                        ? setSelectedStudentIds([])
                                        : setSelectedStudentIds(studentOptions.map((s) => s.id))
                                }
                            >
                                {areAllStudentsSelected ? 'Deselect all' : 'Select all'}
                            </Button>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {studentOptions.map((s) => (
                                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(s.id)}
                                        onChange={(e) =>
                                            setSelectedStudentIds((prev) =>
                                                e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                                            )
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-[#862733] focus:ring-[#862733]"
                                    />
                                    <span className="truncate">{s.name}</span>
                                </label>
                            ))}
                            {studentOptions.length === 0 && (
                                <p className="text-xs text-gray-400 py-2">No students enrolled yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-800">Assignments</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {selectedAssignmentIds.length} selected
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                    areAllAssignmentsSelected
                                        ? setSelectedAssignmentIds([])
                                        : setSelectedAssignmentIds(assignmentOptions.map((a) => a.id))
                                }
                            >
                                {areAllAssignmentsSelected ? 'Deselect all' : 'Select all'}
                            </Button>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {assignmentOptions.map((a) => (
                                <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedAssignmentIds.includes(a.id)}
                                        onChange={(e) =>
                                            setSelectedAssignmentIds((prev) =>
                                                e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                                            )
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-[#862733] focus:ring-[#862733]"
                                    />
                                    <span className="truncate">{a.title}</span>
                                </label>
                            ))}
                            {assignmentOptions.length === 0 && (
                                <p className="text-xs text-gray-400 py-2">No assignments yet.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick filters</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('ungraded')}
                            disabled={totalNeedsGrading === 0}
                            className="text-xs h-8 gap-1.5"
                        >
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            Ungraded ({totalNeedsGrading})
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('missing')}
                            disabled={totalMissingSubmissions === 0}
                            className="text-xs h-8 gap-1.5"
                        >
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            Missing ({totalMissingSubmissions})
                        </Button>
                        {(selectedStudentIds.length > 0 || selectedAssignmentIds.length > 0) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearSelections}
                                className="text-xs h-8 gap-1.5 text-gray-500"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Selected grade report — one card per student */}
            {shouldShowSelectedReport ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Selected grade report</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} · {selectedAssignments.length} assignment{selectedAssignments.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    {selectedStudents.map((student) => {
                        const scores = selectedAssignments
                            .map((a) => getGradeForAssignment(student, a.id)?.score)
                            .filter((v): v is number => typeof v === 'number');
                        const average = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null;

                        return (
                            <Card key={student.id} className="border-0 shadow-sm overflow-hidden">
                                {/* Student header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                                    <div>
                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {student.student_id && <span>ID: {student.student_id} · </span>}
                                            {student.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {average != null && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 mb-0.5">Average</p>
                                                <ScoreBadge percent={average} successThreshold={75} warningThreshold={0}>
                                                    {average.toFixed(1)}%
                                                </ScoreBadge>
                                            </div>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-3 text-xs gap-1.5 text-gray-600 shrink-0"
                                            onClick={() => handleDownloadStudentCSV(student)}
                                        >
                                            <FileDown className="w-3.5 h-3.5" />
                                            CSV
                                        </Button>
                                    </div>
                                </div>

                                {/* Assignment rows */}
                                <div className="divide-y divide-gray-100">
                                    {selectedAssignments.map((a) => {
                                        const grade = getGradeForAssignment(student, a.id);
                                        const cfg = grade ? STATUS_CONFIG[grade.status] : STATUS_CONFIG.not_submitted;
                                        return (
                                            <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-gray-800 truncate">{a.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{a.max_score} pts</p>
                                                </div>
                                                <div className="ml-4 shrink-0">
                                                    {grade?.score != null ? (
                                                        <ScoreBadge percent={grade.score} successThreshold={75} warningThreshold={0}>
                                                            {grade.score.toFixed(1)}%
                                                        </ScoreBadge>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
                                                            {cfg.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-8 text-center text-sm text-gray-400">
                        Select at least one student and one assignment above to view the grade report.
                    </CardContent>
                </Card>
            )}

            {/* Student course averages */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Student course averages</CardTitle>
                    <CardDescription>Current standing for each enrolled student.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-5 font-medium text-gray-600">Student</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Average</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Completed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(courseReport?.student_reports ?? []).map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="py-3 px-5">
                                        <p className="font-medium text-gray-900">{s.name}</p>
                                        {s.student_id && <p className="text-xs text-gray-400">ID: {s.student_id}</p>}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-xs">{s.email}</td>
                                    <td className="py-3 px-4 text-center">
                                        {s.average_score != null ? (
                                            <ScoreBadge percent={s.average_score} successThreshold={90} warningThreshold={75}>
                                                {s.average_score.toFixed(1)}%
                                            </ScoreBadge>
                                        ) : (
                                            <span className="text-xs text-gray-400">No graded work</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full bg-[#862733]"
                                                    style={{
                                                        width: s.total_assignments > 0
                                                            ? `${Math.min(100, (s.completed_assignments / s.total_assignments) * 100).toFixed(0)}%`
                                                            : '0%',
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-600 tabular-nums">
                                                {s.completed_assignments}/{s.total_assignments}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && !courseReport?.student_reports?.length && (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                                        No students enrolled yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
