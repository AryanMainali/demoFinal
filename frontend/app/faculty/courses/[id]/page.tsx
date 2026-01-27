'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    FileText,
    Plus,
    Search,
    UserPlus,
    Upload,
    Trash2,
    Mail,
    Download,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface Student {
    id: string;
    email: string;
    full_name: string;
    student_id: string;
    enrolled_at: string;
    submissions_count: number;
    average_score: number;
}

interface Assignment {
    id: string;
    title: string;
    due_date: string;
    max_score: number;
    submissions_count: number;
    graded_count: number;
    status: 'active' | 'closed' | 'draft';
}

export default function FacultyCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const courseId = params.id as string;

    const [activeTab, setActiveTab] = useState('students');
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollModal, setEnrollModal] = useState(false);
    const [bulkEnrollModal, setBulkEnrollModal] = useState(false);
    const [enrollEmail, setEnrollEmail] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { data: course } = useQuery({
        queryKey: ['faculty-course', courseId],
        queryFn: () => apiClient.getCourse(parseInt(courseId) || 1),
    });

    // Mock data
    const mockCourse = {
        id: courseId,
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Learn the basics of programming with Python',
        semester: 'Spring',
        year: 2026,
        students_count: 45,
        assignments_count: 8,
    };

    const mockStudents: Student[] = [
        { id: '1', email: 'john.smith@university.edu', full_name: 'John Smith', student_id: 'STU001', enrolled_at: '2026-01-15', submissions_count: 7, average_score: 85 },
        { id: '2', email: 'jane.doe@university.edu', full_name: 'Jane Doe', student_id: 'STU002', enrolled_at: '2026-01-15', submissions_count: 8, average_score: 92 },
        { id: '3', email: 'bob.wilson@university.edu', full_name: 'Bob Wilson', student_id: 'STU003', enrolled_at: '2026-01-16', submissions_count: 6, average_score: 78 },
        { id: '4', email: 'alice.brown@university.edu', full_name: 'Alice Brown', student_id: 'STU004', enrolled_at: '2026-01-16', submissions_count: 8, average_score: 88 },
        { id: '5', email: 'charlie.davis@university.edu', full_name: 'Charlie Davis', student_id: 'STU005', enrolled_at: '2026-01-17', submissions_count: 5, average_score: 72 },
    ];

    const mockAssignments: Assignment[] = [
        { id: '1', title: 'Hello World Program', due_date: '2026-01-20', max_score: 100, submissions_count: 45, graded_count: 45, status: 'closed' },
        { id: '2', title: 'Variables and Data Types', due_date: '2026-01-27', max_score: 100, submissions_count: 43, graded_count: 40, status: 'closed' },
        { id: '3', title: 'Control Flow Statements', due_date: '2026-02-03', max_score: 100, submissions_count: 38, graded_count: 0, status: 'active' },
        { id: '4', title: 'Functions and Methods', due_date: '2026-02-10', max_score: 100, submissions_count: 0, graded_count: 0, status: 'active' },
    ];

    const displayCourse = course || mockCourse;

    const enrollMutation = useMutation({
        mutationFn: async (email: string) => {
            // Mock enrollment - in real app would call apiClient.enrollStudent
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty-course', courseId] });
            setEnrollModal(false);
            setEnrollEmail('');
            setSuccessMessage('Student enrolled successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const bulkEnrollMutation = useMutation({
        mutationFn: async (emails: string[]) => {
            // Mock bulk enrollment - in real app would call API
            return { enrolled: emails.length };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['faculty-course', courseId] });
            setBulkEnrollModal(false);
            setBulkEmails('');
            setSuccessMessage(`Successfully enrolled ${data?.enrolled || 'multiple'} students!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const unenrollMutation = useMutation({
        mutationFn: async (studentId: string) => {
            // Mock unenrollment - in real app would call API
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty-course', courseId] });
            setSuccessMessage('Student removed from course');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const handleBulkEnroll = () => {
        const emails = bulkEmails
            .split(/[\n,;]+/)
            .map(e => e.trim())
            .filter(e => e && e.includes('@'));

        if (emails.length > 0) {
            bulkEnrollMutation.mutate(emails);
        }
    };

    const filteredStudents = mockStudents.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const studentColumns = [
        {
            header: 'Student',
            key: 'full_name' as const,
            render: (student: Student) => (
                <div>
                    <p className="font-medium text-gray-900">{student.full_name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                </div>
            ),
        },
        {
            header: 'Student ID',
            key: 'student_id' as const,
        },
        {
            header: 'Submissions',
            key: 'submissions_count' as const,
            render: (student: Student) => (
                <span>{student.submissions_count} / {mockAssignments.length}</span>
            ),
        },
        {
            header: 'Average',
            key: 'average_score' as const,
            render: (student: Student) => (
                <Badge variant={student.average_score >= 80 ? 'success' : student.average_score >= 60 ? 'warning' : 'danger'}>
                    {student.average_score}%
                </Badge>
            ),
        },
        {
            header: 'Actions',
            key: 'id' as const,
            render: (student: Student) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unenrollMutation.mutate(student.id)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const assignmentColumns = [
        {
            header: 'Assignment',
            key: 'title' as const,
            render: (assignment: Assignment) => (
                <div>
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-500">Max Score: {assignment.max_score}</p>
                </div>
            ),
        },
        {
            header: 'Due Date',
            key: 'due_date' as const,
            render: (assignment: Assignment) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(assignment.due_date).toLocaleDateString()}
                </div>
            ),
        },
        {
            header: 'Submissions',
            key: 'submissions_count' as const,
            render: (assignment: Assignment) => (
                <span>{assignment.submissions_count} / {mockStudents.length}</span>
            ),
        },
        {
            header: 'Graded',
            key: 'graded_count' as const,
            render: (assignment: Assignment) => (
                <div className="flex items-center gap-2">
                    <span>{assignment.graded_count} / {assignment.submissions_count}</span>
                    {assignment.graded_count === assignment.submissions_count && assignment.submissions_count > 0 && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                </div>
            ),
        },
        {
            header: 'Status',
            key: 'status' as const,
            render: (assignment: Assignment) => (
                <Badge variant={assignment.status === 'active' ? 'success' : assignment.status === 'closed' ? 'default' : 'warning'}>
                    {assignment.status}
                </Badge>
            ),
        },
        {
            header: 'Actions',
            key: 'id' as const,
            render: (assignment: Assignment) => (
                <Link href={`/faculty/assignments/${assignment.id}`}>
                    <Button variant="outline" size="sm">
                        View Submissions
                    </Button>
                </Link>
            ),
        },
    ];

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
                    <div className="flex items-start gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{displayCourse.name}</h1>
                                <Badge variant="primary">{displayCourse.code}</Badge>
                            </div>
                            <p className="text-gray-500 mt-1">{displayCourse.description}</p>
                            <p className="text-sm text-gray-400 mt-1">{displayCourse.semester} {displayCourse.year}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{mockStudents.length}</p>
                                        <p className="text-sm text-gray-500">Students</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{mockAssignments.length}</p>
                                        <p className="text-sm text-gray-500">Assignments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {Math.round(mockStudents.reduce((acc, s) => acc + s.average_score, 0) / mockStudents.length)}%
                                        </p>
                                        <p className="text-sm text-gray-500">Class Average</p>
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
                                        <p className="text-2xl font-bold">
                                            {mockAssignments.filter(a => a.status === 'active').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Active Assignments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        tabs={[
                            { id: 'students', label: `Students (${mockStudents.length})`, icon: <Users className="w-4 h-4" /> },
                            { id: 'assignments', label: `Assignments (${mockAssignments.length})`, icon: <FileText className="w-4 h-4" /> }
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {activeTab === 'students' && (
                        <TabPanel className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setEnrollModal(true)}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add Student
                                    </Button>
                                    <Button onClick={() => setBulkEnrollModal(true)}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Bulk Import
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <DataTable
                                        columns={studentColumns}
                                        data={filteredStudents}
                                    />
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}

                    {activeTab === 'assignments' && (
                        <TabPanel className="space-y-4">
                            <div className="flex justify-end">
                                <Link href={`/faculty/assignments/new?course=${courseId}`}>
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Assignment
                                    </Button>
                                </Link>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <DataTable
                                        columns={assignmentColumns}
                                        data={mockAssignments}
                                    />
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}
                </div>

                {/* Enroll Single Student Modal */}
                <Modal isOpen={enrollModal} onClose={() => setEnrollModal(false)} title="Add Student" size="md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Student Email
                        </label>
                        <Input
                            type="email"
                            placeholder="student@university.edu"
                            value={enrollEmail}
                            onChange={(e) => setEnrollEmail(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setEnrollModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => enrollMutation.mutate(enrollEmail)}
                            disabled={!enrollEmail || enrollMutation.isPending}
                        >
                            {enrollMutation.isPending ? 'Adding...' : 'Add Student'}
                        </Button>
                    </div>
                </Modal>

                {/* Bulk Enroll Modal */}
                <Modal isOpen={bulkEnrollModal} onClose={() => setBulkEnrollModal(false)} title="Bulk Import Students" size="lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Student Emails
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm"
                            rows={10}
                            placeholder="Enter student emails, one per line or separated by commas:&#10;student1@university.edu&#10;student2@university.edu&#10;student3@university.edu"
                            value={bulkEmails}
                            onChange={(e) => setBulkEmails(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            You can paste emails from a spreadsheet. Separate emails by new lines, commas, or semicolons.
                        </p>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                            {bulkEmails.split(/[\n,;]+/).filter(e => e.trim() && e.includes('@')).length} valid emails detected
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setBulkEnrollModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkEnroll}
                            disabled={bulkEnrollMutation.isPending}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {bulkEnrollMutation.isPending ? 'Importing...' : 'Import Students'}
                        </Button>
                    </div>
                </Modal>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
