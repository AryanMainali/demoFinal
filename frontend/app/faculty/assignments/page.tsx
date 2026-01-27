'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import Link from 'next/link';
import {
    Plus,
    Search,
    FileText,
    Calendar,
    Clock,
    Users,
    CheckCircle,
    AlertCircle,
    Edit,
    Trash2,
    Eye,
    Code,
    Filter
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    description: string;
    course_id: string;
    course_name: string;
    course_code: string;
    due_date: string;
    max_score: number;
    language: string;
    submissions_count: number;
    graded_count: number;
    status: 'active' | 'closed' | 'draft';
    created_at: string;
}

export default function FacultyAssignmentsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCourse, setFilterCourse] = useState<string>('all');
    const [createModal, setCreateModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; assignment?: Assignment }>({ open: false });
    const [successMessage, setSuccessMessage] = useState('');

    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        course_id: '',
        due_date: '',
        max_score: 100,
        language: 'python',
        starter_code: '',
        test_cases: '',
    });

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['faculty-assignments'],
        queryFn: () => apiClient.getAssignments(),
    });

    const { data: courses = [] } = useQuery({
        queryKey: ['faculty-courses'],
        queryFn: () => apiClient.getCourses(),
    });

    // Mock data
    const mockAssignments: Assignment[] = [
        {
            id: '1',
            title: 'Hello World Program',
            description: 'Write a program that prints Hello World',
            course_id: '1',
            course_name: 'Introduction to Programming',
            course_code: 'CS101',
            due_date: '2026-01-20T23:59:00',
            max_score: 100,
            language: 'python',
            submissions_count: 45,
            graded_count: 45,
            status: 'closed',
            created_at: '2026-01-10',
        },
        {
            id: '2',
            title: 'Variables and Data Types',
            description: 'Practice with different data types',
            course_id: '1',
            course_name: 'Introduction to Programming',
            course_code: 'CS101',
            due_date: '2026-01-27T23:59:00',
            max_score: 100,
            language: 'python',
            submissions_count: 43,
            graded_count: 40,
            status: 'closed',
            created_at: '2026-01-15',
        },
        {
            id: '3',
            title: 'Control Flow Statements',
            description: 'If-else and loop exercises',
            course_id: '1',
            course_name: 'Introduction to Programming',
            course_code: 'CS101',
            due_date: '2026-02-03T23:59:00',
            max_score: 100,
            language: 'python',
            submissions_count: 38,
            graded_count: 0,
            status: 'active',
            created_at: '2026-01-20',
        },
        {
            id: '4',
            title: 'Linked List Implementation',
            description: 'Implement a singly linked list',
            course_id: '2',
            course_name: 'Data Structures',
            course_code: 'CS201',
            due_date: '2026-02-10T23:59:00',
            max_score: 150,
            language: 'java',
            submissions_count: 20,
            graded_count: 0,
            status: 'active',
            created_at: '2026-01-25',
        },
        {
            id: '5',
            title: 'Binary Search Tree',
            description: 'Implement BST with insert and search',
            course_id: '2',
            course_name: 'Data Structures',
            course_code: 'CS201',
            due_date: '2026-02-17T23:59:00',
            max_score: 150,
            language: 'java',
            submissions_count: 0,
            graded_count: 0,
            status: 'draft',
            created_at: '2026-01-27',
        },
    ];

    const mockCourses = [
        { id: '1', code: 'CS101', name: 'Introduction to Programming' },
        { id: '2', code: 'CS201', name: 'Data Structures' },
        { id: '3', code: 'CS301', name: 'Database Systems' },
    ];

    const displayAssignments = assignments.length > 0 ? assignments : mockAssignments;
    const displayCourses = courses.length > 0 ? courses : mockCourses;

    const filteredAssignments = displayAssignments.filter((a: Assignment) => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.course_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesCourse = filterCourse === 'all' || a.course_id === filterCourse;
        return matchesSearch && matchesStatus && matchesCourse;
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof newAssignment) => apiClient.createAssignment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
            setCreateModal(false);
            setNewAssignment({
                title: '',
                description: '',
                course_id: '',
                due_date: '',
                max_score: 100,
                language: 'python',
                starter_code: '',
                test_cases: '',
            });
            setSuccessMessage('Assignment created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteAssignment(parseInt(id) || 0),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
            setDeleteModal({ open: false });
            setSuccessMessage('Assignment deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="success">Active</Badge>;
            case 'closed':
                return <Badge variant="default">Closed</Badge>;
            case 'draft':
                return <Badge variant="warning">Draft</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getLanguageBadge = (language: string) => {
        const colors: Record<string, string> = {
            python: 'bg-blue-100 text-blue-800',
            java: 'bg-orange-100 text-orange-800',
            javascript: 'bg-yellow-100 text-yellow-800',
            cpp: 'bg-purple-100 text-purple-800',
            c: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[language] || colors.c}`}>
                {language.toUpperCase()}
            </span>
        );
    };

    const columns = [
        {
            header: 'Assignment',
            key: 'title' as const,
            render: (assignment: Assignment) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#862733]/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#862733]" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{assignment.title}</p>
                        <p className="text-sm text-gray-500">{assignment.course_code} - {assignment.course_name}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Language',
            key: 'language' as const,
            render: (assignment: Assignment) => getLanguageBadge(assignment.language),
        },
        {
            header: 'Due Date',
            key: 'due_date' as const,
            render: (assignment: Assignment) => {
                const due = new Date(assignment.due_date);
                const isPast = due < new Date();
                return (
                    <div className={`flex items-center gap-1 ${isPast ? 'text-red-600' : 'text-gray-600'}`}>
                        <Calendar className="w-4 h-4" />
                        {due.toLocaleDateString()}
                    </div>
                );
            },
        },
        {
            header: 'Submissions',
            key: 'submissions_count' as const,
            render: (assignment: Assignment) => (
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{assignment.submissions_count}</span>
                    {assignment.graded_count > 0 && (
                        <span className="text-gray-400">
                            ({assignment.graded_count} graded)
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Status',
            key: 'status' as const,
            render: (assignment: Assignment) => getStatusBadge(assignment.status),
        },
        {
            header: 'Actions',
            key: 'id' as const,
            render: (assignment: Assignment) => (
                <div className="flex items-center gap-1">
                    <Link href={`/faculty/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href={`/faculty/grading?assignment=${assignment.id}`}>
                        <Button variant="ghost" size="sm">
                            <CheckCircle className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href={`/faculty/assignments/${assignment.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteModal({ open: true, assignment })}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const activeCount = displayAssignments.filter((a: Assignment) => a.status === 'active').length;
    const pendingGrading = displayAssignments.reduce((acc: number, a: Assignment) =>
        acc + (a.submissions_count - a.graded_count), 0);

    return (
        <ProtectedRoute allowedRoles={['FACULTY']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {successMessage && (
                        <Alert type="success" title="Success">
                            {successMessage}
                        </Alert>
                    )}

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                            <p className="text-gray-500 mt-1">Create and manage programming assignments</p>
                        </div>
                        <Link href="/faculty/assignments/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Assignment
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{displayAssignments.length}</p>
                                        <p className="text-sm text-gray-500">Total Assignments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{activeCount}</p>
                                        <p className="text-sm text-gray-500">Active</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{pendingGrading}</p>
                                        <p className="text-sm text-gray-500">Pending Grading</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Code className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {displayAssignments.reduce((acc: number, a: Assignment) => acc + a.submissions_count, 0)}
                                        </p>
                                        <p className="text-sm text-gray-500">Total Submissions</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent"
                                    value={filterCourse}
                                    onChange={(e) => setFilterCourse(e.target.value)}
                                >
                                    <option value="all">All Courses</option>
                                    {displayCourses.map((course: any) => (
                                        <option key={course.id} value={course.id}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignments</CardTitle>
                            <CardDescription>
                                {filteredAssignments.length} assignments found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={filteredAssignments}
                                isLoading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Delete Assignment" size="md">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                Are you sure you want to delete "{deleteModal.assignment?.title}"?
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                This will also delete all {deleteModal.assignment?.submissions_count} submissions. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setDeleteModal({ open: false })}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteModal.assignment && deleteMutation.mutate(deleteModal.assignment.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Assignment'}
                        </Button>
                    </div>
                </Modal>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
