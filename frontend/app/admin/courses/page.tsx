'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import { useMutationWithInvalidation } from '@/lib/use-mutation-with-invalidation';
import apiClient from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { AcknowledgementPopup } from '@/components/ui/acknowledgement-popup';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dropdown } from '@/components/ui/dropdown';
import { Tabs } from '@/components/ui/tabs';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Users,
    BookOpen,
    Calendar,
    Eye,
    Archive,
    UserPlus,
    Loader2,
    GraduationCap,
    UserCog,
    Mail
} from 'lucide-react';

interface Course {
    id: number;
    name: string;
    code: string;
    description?: string;
    instructor_id: number;
    instructor_name?: string;
    semester?: string;
    year?: number;
    section?: string;
    is_active: boolean;
    student_count?: number;
    assignment_count?: number;
    created_at: string;
}

interface StudentInCourse {
    id: number;
    email: string;
    full_name: string;
    student_id?: string | null;
}

interface AssistantInCourse {
    id: number;
    email: string;
    full_name?: string | null;
}

export default function CoursesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [createModal, setCreateModal] = useState(false);
    const [enrollModal, setEnrollModal] = useState<{ open: boolean; course?: Course }>({ open: false });
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);
    const [enrollListLoading, setEnrollListLoading] = useState(false);
    const [membersModal, setMembersModal] = useState<{ open: boolean; course?: Course }>({ open: false });
    const [courseStudents, setCourseStudents] = useState<StudentInCourse[]>([]);
    const [courseAssistants, setCourseAssistants] = useState<AssistantInCourse[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [notification, setNotification] = useState<{
        open: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({
        open: false,
        type: 'success',
        title: 'Success',
        message: '',
    });
    const [editCourseId, setEditCourseId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<any>(null);

    const [newCourse, setNewCourse] = useState({
        name: '',
        code: '',
        description: '',
        instructor_id: '',
        section: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        is_active: true,
    });


    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: () => apiClient.getCourses(),
    });

    const { data: faculty = [] } = useQuery({
        queryKey: ['users', 'FACULTY'],
        queryFn: () => apiClient.getUsers('FACULTY'),
    });

    const { data: students = [] } = useQuery({
        queryKey: ['users', 'STUDENT'],
        queryFn: () => apiClient.getUsers('STUDENT'),
    });

    // Transform courses data to match admin page interface
    // Map backend field names (students_count, assignments_count) to frontend interface names
    const transformedCourses = courses.map((course: any) => {
        const instructor = faculty.find((f: any) => f.id === course.instructor_id);
        return {
            ...course,
            instructor_name: instructor?.full_name || 'Unassigned',
            student_count: course.students_count || 0,
            assignment_count: course.assignments_count || 0,
        };
    });

    const createMutation = useMutationWithInvalidation({
        mutationFn: (data: any) => apiClient.createCourse(data),
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => {
            setCreateModal(false);
            setNewCourse({
                name: '',
                code: '',
                description: '',
                instructor_id: '',
                section: '',
                semester: 'Fall',
                year: new Date().getFullYear(),
                is_active: true,
            });
        },
    });

    const updateMutation = useMutationWithInvalidation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateCourse(id, data),
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => {
            setEditCourseId(null);
            setEditFormData(null);
        },
    });

    const deleteMutation = useMutationWithInvalidation({
        mutationFn: (courseId: number) => apiClient.deleteCourse(courseId),
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => {
            setNotification({
                open: true,
                type: 'success',
                title: 'Success',
                message: 'Course deleted successfully.',
            });
        },
        onError: (err: unknown) => {
            const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete course.';
            setNotification({
                open: true,
                type: 'error',
                title: 'Error',
                message: typeof message === 'string' ? message : 'Failed to delete course.',
            });
        },
    });

    const archiveMutation = useMutationWithInvalidation({
        mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
            apiClient.updateCourse(id, {
                status: isActive ? 'archived' : 'active',
                is_active: !isActive,
            }),
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: (_data, variables) => {
            setNotification({
                open: true,
                type: 'success',
                title: 'Success',
                message: variables.isActive ? 'Course archived successfully.' : 'Course unarchived successfully.',
            });
        },
        onError: (err: unknown) => {
            const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update course status.';
            setNotification({
                open: true,
                type: 'error',
                title: 'Error',
                message: typeof message === 'string' ? message : 'Failed to update course status.',
            });
        },
    });

    const enrollSelectedStudentsMutation = useMutationWithInvalidation({
        mutationFn: async ({ courseId, studentIds }: { courseId: number; studentIds: number[] }) => {
            const results = await Promise.allSettled(
                studentIds.map((studentId) => apiClient.enrollStudent(courseId, studentId))
            );
            return {
                success: results.filter((r) => r.status === 'fulfilled').length,
                failed: results.filter((r) => r.status === 'rejected').length,
            };
        },
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => {
            setEnrollModal({ open: false });
            setSelectedStudentIds([]);
            setStudentSearchQuery('');
            setEnrolledStudentIds([]);
        },
    });

    const enrolledStudentIdSet = new Set(enrolledStudentIds);

    const filteredStudentsForEnroll = students.filter((student: any) => {
        const matchesQuery =
            student.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(studentSearchQuery.toLowerCase());

        return matchesQuery && !enrolledStudentIdSet.has(student.id);
    });

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const openEnrollModal = async (course: Course) => {
        setEnrollModal({ open: true, course });
        setSelectedStudentIds([]);
        setStudentSearchQuery('');
        setEnrollListLoading(true);

        try {
            const enrolledStudents = await apiClient.getCourseStudents(course.id) as StudentInCourse[];
            setEnrolledStudentIds(enrolledStudents.map((student) => student.id));
        } catch {
            setEnrolledStudentIds([]);
        } finally {
            setEnrollListLoading(false);
        }
    };

    const openMembersModal = async (course: Course) => {
        setMembersModal({ open: true, course });
        setMembersLoading(true);

        try {
            const [studentsData, assistantsData] = await Promise.all([
                apiClient.getCourseStudents(course.id) as Promise<StudentInCourse[]>,
                apiClient.getCourseAssistants(course.id) as Promise<AssistantInCourse[]>,
            ]);

            setCourseStudents(studentsData);
            setCourseAssistants(assistantsData);
        } catch {
            setCourseStudents([]);
            setCourseAssistants([]);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleDeleteCourse = (course: Course) => {
        const confirmed = window.confirm(
            `Delete ${course.code} - ${course.name}? This action cannot be undone.`
        );
        if (!confirmed) return;
        deleteMutation.mutate(course.id);
    };

    const filteredCourses = transformedCourses.filter((course: Course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { id: 'all', label: 'All Courses', count: transformedCourses.length },
        { id: 'active', label: 'Active', count: transformedCourses.filter((c: Course) => c.is_active).length },
        { id: 'archived', label: 'Archived', count: transformedCourses.filter((c: Course) => !c.is_active).length },
    ];

    const columns = [
        {
            key: 'course',
            header: 'Course',
            cell: (course: Course) => (
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{course.name}</p>
                        <Badge variant="outline">{course.code}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.description || 'No description'}</p>
                </div>
            ),
        },
        {
            key: 'instructor',
            header: 'Instructor',
            cell: (course: Course) => (
                <span className="text-sm">{course.instructor_name || 'Unassigned'}</span>
            ),
        },
        {
            key: 'semester',
            header: 'Semester',
            cell: (course: Course) => (
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{course.semester} {course.year}</span>
                </div>
            ),
        },
        {
            key: 'students',
            header: 'Students',
            cell: (course: Course) => (
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{course.student_count || 0}</span>
                </div>
            ),
        },
        {
            key: 'assignments',
            header: 'Assignments',
            cell: (course: Course) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{course.assignment_count || 0}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (course: Course) => (
                <Badge variant={course.is_active ? 'success' : 'default'}>
                    {course.is_active ? 'Active' : 'Archived'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (course: Course) => (
                <Dropdown
                    trigger={
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                    }
                    items={[
                        { label: 'View', value: 'view', icon: <Eye className="w-4 h-4" /> },
                        { label: 'Edit', value: 'edit', icon: <Edit className="w-4 h-4" /> },
                        { label: 'Enroll Students', value: 'enroll', icon: <UserPlus className="w-4 h-4" /> },
                        { label: course.is_active ? 'Archive' : 'Unarchive', value: 'archive', icon: <Archive className="w-4 h-4" /> },
                        { label: 'Delete', value: 'delete', icon: <Trash2 className="w-4 h-4" />, danger: true },
                    ]}
                    onSelect={(value) => {
                        if (value === 'view') openMembersModal(course);
                        else if (value === 'enroll') openEnrollModal(course);
                        else if (value === 'archive') archiveMutation.mutate({ id: course.id, isActive: course.is_active });
                        else if (value === 'delete') handleDeleteCourse(course);
                        else if (value === 'edit') {
                            setEditCourseId(course.id);
                            setEditFormData({
                                name: course.name,
                                code: course.code,
                                description: course.description || '',
                                instructor_id: course.instructor_id,
                                section: course.section || '',
                                semester: course.semester || 'Fall',
                                year: course.year || new Date().getFullYear(),
                                is_active: course.is_active,
                            });
                        }
                    }}
                    align="right"
                />
            ),
        },
    ];

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                            <p className="text-gray-500 mt-1">Manage courses, enrollments, and assignments</p>
                        </div>
                        <Button onClick={() => setCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Course
                        </Button>
                    </div>

                    {/* Tabs & Search */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <Tabs
                                    tabs={tabs}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    className="flex-1"
                                />
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search courses..."
                                    className="md:w-64"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Courses Table */}
                    <Card>
                        <DataTable
                            columns={columns}
                            data={filteredCourses.filter((c: Course) =>
                                activeTab === 'all' ? true :
                                    activeTab === 'active' ? c.is_active :
                                        !c.is_active
                            )}
                            isLoading={isLoading}
                            emptyMessage="No courses found"
                        />
                    </Card>
                </div>

                {/* Create Course Modal */}
                <Modal
                    isOpen={createModal}
                    onClose={() => setCreateModal(false)}
                    title="Create New Course"
                    description="Set up a new course for the semester"
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input
                                label="Course Name"
                                value={newCourse.name}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Introduction to Programming"
                            />
                            <Input
                                label="Course Code"
                                value={newCourse.code}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="CS101"
                            />
                            <Input
                                label="Section"
                                value={newCourse.section}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, section: e.target.value }))}
                                placeholder="e.g., A, B, 001"
                            />
                        </div>
                        <Textarea
                            label="Description"
                            value={newCourse.description}
                            onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter course description..."
                        />
                        <Select
                            label="Instructor"
                            value={newCourse.instructor_id}
                            onChange={(e) => setNewCourse(prev => ({ ...prev, instructor_id: e.target.value }))}
                            options={faculty.map((f: any) => ({ value: f.id.toString(), label: f.full_name }))}
                            placeholder="Select instructor"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Semester"
                                value={newCourse.semester}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                                options={[
                                    { value: 'Fall', label: 'Fall' },
                                    { value: 'Spring', label: 'Spring' },
                                    { value: 'Summer', label: 'Summer' },
                                ]}
                            />
                            <Input
                                label="Year"
                                type="number"
                                value={newCourse.year.toString()}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            />
                        </div>
                        <Switch
                            checked={newCourse.is_active}
                            onChange={(checked) => setNewCourse(prev => ({ ...prev, is_active: checked }))}
                            label="Active Course"
                            description="Course is visible to students and faculty"
                        />
                    </div>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const courseData = {
                                    ...newCourse,
                                    instructor_id: newCourse.instructor_id ? parseInt(newCourse.instructor_id) : null,
                                };
                                createMutation.mutate(courseData);
                            }}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Course'}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* Edit Course Modal */}
                <Modal
                    isOpen={editCourseId !== null && editFormData !== null}
                    onClose={() => {
                        setEditCourseId(null);
                        setEditFormData(null);
                    }}
                    title="Edit Course"
                    description="Update course information"
                    size="lg"
                >
                    {editFormData && (
                        <>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Input
                                        label="Course Name"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Introduction to Programming"
                                    />
                                    <Input
                                        label="Course Code"
                                        value={editFormData.code}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="CS101"
                                    />
                                    <Input
                                        label="Section"
                                        value={editFormData.section}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, section: e.target.value }))}
                                        placeholder="A"
                                    />
                                </div>
                                <Textarea
                                    label="Description"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Course description"
                                    rows={3}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Select
                                        label="Instructor"
                                        value={editFormData.instructor_id?.toString() || ''}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, instructor_id: parseInt(e.target.value) }))}
                                        options={faculty.map((f: any) => ({
                                            value: f.id.toString(),
                                            label: f.full_name
                                        }))}
                                    />
                                    <Select
                                        label="Semester"
                                        value={editFormData.semester}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, semester: e.target.value }))}
                                        options={[
                                            { value: 'Spring', label: 'Spring' },
                                            { value: 'Summer', label: 'Summer' },
                                            { value: 'Fall', label: 'Fall' },
                                            { value: 'Winter', label: 'Winter' },
                                        ]}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Year"
                                        type="number"
                                        value={editFormData.year?.toString()}
                                        onChange={(e) => setEditFormData((prev: Course) => ({ ...prev, year: parseInt(e.target.value) }))}
                                    />
                                    <Switch
                                        checked={editFormData.is_active}
                                        onChange={(checked: boolean) => setEditFormData((prev: Course) => ({ ...prev, is_active: checked }))}
                                        label="Active Course"
                                        description="Course is visible to students and faculty"
                                    />
                                </div>
                            </div>
                            <ModalFooter>
                                <Button variant="outline" onClick={() => {
                                    setEditCourseId(null);
                                    setEditFormData(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (editCourseId !== null) {
                                            const courseData = {
                                                ...editFormData,
                                                instructor_id: editFormData.instructor_id ? parseInt(editFormData.instructor_id) : null,
                                            };
                                            updateMutation.mutate({ id: editCourseId, data: courseData });
                                        }
                                    }}
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? 'Updating...' : 'Update Course'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </Modal>

                {/* Enroll Students Modal */}
                <Modal
                    isOpen={enrollModal.open}
                    onClose={() => {
                        setEnrollModal({ open: false });
                        setSelectedStudentIds([]);
                        setStudentSearchQuery('');
                        setEnrolledStudentIds([]);
                    }}
                    title="Enroll Students"
                    description={`Add students to ${enrollModal.course?.name}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <SearchInput
                            value={studentSearchQuery}
                            onChange={setStudentSearchQuery}
                            placeholder="Search students..."
                        />
                        <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                            {enrollListLoading ? (
                                <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading available students...</span>
                                </div>
                            ) : filteredStudentsForEnroll.length > 0 ? (
                                filteredStudentsForEnroll.map((student: any) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={() => toggleStudentSelection(student.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#862733] focus:ring-[#862733]"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{student.full_name}</p>
                                            <p className="text-xs text-gray-500">{student.email}</p>
                                        </div>
                                        <Badge variant="outline">{student.student_id || 'N/A'}</Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-gray-500">
                                    No available students to enroll.
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{selectedStudentIds.length} students selected</span>
                            <span>
                                {enrollSelectedStudentsMutation.data?.failed
                                    ? `${enrollSelectedStudentsMutation.data.success} enrolled, ${enrollSelectedStudentsMutation.data.failed} failed`
                                    : ''}
                            </span>
                        </div>
                    </div>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEnrollModal({ open: false });
                                setSelectedStudentIds([]);
                                setStudentSearchQuery('');
                                setEnrolledStudentIds([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!enrollModal.course || selectedStudentIds.length === 0) return;
                                enrollSelectedStudentsMutation.mutate({
                                    courseId: enrollModal.course.id,
                                    studentIds: selectedStudentIds,
                                });
                            }}
                            disabled={selectedStudentIds.length === 0 || enrollSelectedStudentsMutation.isPending}
                        >
                            {enrollSelectedStudentsMutation.isPending ? 'Enrolling...' : 'Enroll Students'}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* Course Members Modal */}
                <Modal
                    isOpen={membersModal.open}
                    onClose={() => {
                        setMembersModal({ open: false });
                        setCourseStudents([]);
                        setCourseAssistants([]);
                    }}
                    title="Course Members"
                    description={membersModal.course ? `${membersModal.course.name} (${membersModal.course.code})` : ''}
                    size="lg"
                >
                    {membersLoading ? (
                        <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading course members...</span>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg border bg-gray-50">
                                    <p className="text-xs text-gray-500">Teacher</p>
                                    <p className="text-xl font-semibold text-gray-900">{membersModal.course?.instructor_name || 'Unassigned'}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-gray-50">
                                    <p className="text-xs text-gray-500">Students</p>
                                    <p className="text-xl font-semibold text-gray-900">{courseStudents.length}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-gray-50">
                                    <p className="text-xs text-gray-500">Grading Assistants</p>
                                    <p className="text-xl font-semibold text-gray-900">{courseAssistants.length}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-medium text-gray-900">Teacher</h3>
                                </div>
                                <div className="rounded-lg border p-3 text-sm text-gray-700">
                                    {membersModal.course?.instructor_name || 'No teacher assigned'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-medium text-gray-900">Students</h3>
                                </div>
                                <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                                    {courseStudents.length > 0 ? (
                                        courseStudents.map((student) => (
                                            <div key={student.id} className="p-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {student.email}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">{student.student_id || 'N/A'}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-500">No students enrolled in this course.</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <UserCog className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-medium text-gray-900">Grading Assistants</h3>
                                </div>
                                <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                                    {courseAssistants.length > 0 ? (
                                        courseAssistants.map((assistant) => (
                                            <div key={assistant.id} className="p-3">
                                                <p className="text-sm font-medium text-gray-900">{assistant.full_name || 'No Name'}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {assistant.email}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-500">No grading assistants assigned to this course.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setMembersModal({ open: false })}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>
                <AcknowledgementPopup
                    isOpen={notification.open}
                    onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                />
        </ProtectedRoute>
    );
}
