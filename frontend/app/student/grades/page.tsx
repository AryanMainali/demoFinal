'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import {
    Award,
    Search,
    TrendingUp,
    TrendingDown,
    BookOpen,
    FileCode,
    Calendar,
    Download,
    Filter,
    ChevronDown,
    Eye
} from 'lucide-react';
import Link from 'next/link';

interface Grade {
    id: number;
    assignment_id: number;
    assignment_title: string;
    course_id: number;
    course_name: string;
    course_code: string;
    submitted_at: string;
    graded_at: string;
    score: number;
    max_score: number;
    percentage: number;
    tests_passed: number;
    total_tests: number;
    feedback?: string;
}

interface CourseGrade {
    course_id: number;
    course_name: string;
    course_code: string;
    assignments_completed: number;
    total_assignments: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
}

export default function StudentGradesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    const { data: grades = [], isLoading } = useQuery({
        queryKey: ['student-grades'],
        queryFn: () => apiClient.getSubmissions(),
    });

    // Mock data
    const mockGrades: Grade[] = [
        { id: 1, assignment_id: 1, assignment_title: 'Binary Search Tree Implementation', course_id: 1, course_name: 'Data Structures', course_code: 'CS201', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), score: 92, max_score: 100, percentage: 92, tests_passed: 5, total_tests: 5 },
        { id: 2, assignment_id: 2, assignment_title: 'SQL Query Optimization', course_id: 4, course_name: 'Database Systems', course_code: 'CS303', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), score: 88, max_score: 100, percentage: 88, tests_passed: 4, total_tests: 5 },
        { id: 3, assignment_id: 3, assignment_title: 'React Components', course_id: 2, course_name: 'Web Development', course_code: 'CS301', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), score: 95, max_score: 100, percentage: 95, tests_passed: 5, total_tests: 5 },
        { id: 4, assignment_id: 4, assignment_title: 'Linked List Operations', course_id: 1, course_name: 'Data Structures', course_code: 'CS201', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), score: 78, max_score: 100, percentage: 78, tests_passed: 4, total_tests: 5 },
        { id: 5, assignment_id: 5, assignment_title: 'Graph Algorithms', course_id: 3, course_name: 'Algorithm Design', course_code: 'CS202', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(), score: 85, max_score: 100, percentage: 85, tests_passed: 4, total_tests: 5 },
        { id: 6, assignment_id: 6, assignment_title: 'Database Design', course_id: 4, course_name: 'Database Systems', course_code: 'CS303', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), score: 90, max_score: 100, percentage: 90, tests_passed: 5, total_tests: 5 },
        { id: 7, assignment_id: 7, assignment_title: 'Sorting Algorithms', course_id: 3, course_name: 'Algorithm Design', course_code: 'CS202', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(), score: 72, max_score: 100, percentage: 72, tests_passed: 3, total_tests: 5 },
        { id: 8, assignment_id: 8, assignment_title: 'REST API', course_id: 2, course_name: 'Web Development', course_code: 'CS301', submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), graded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(), score: 82, max_score: 100, percentage: 82, tests_passed: 4, total_tests: 5 },
    ];

    const mockCourseGrades: CourseGrade[] = [
        { course_id: 1, course_name: 'Data Structures', course_code: 'CS201', assignments_completed: 6, total_assignments: 8, average_score: 85, highest_score: 92, lowest_score: 78 },
        { course_id: 2, course_name: 'Web Development', course_code: 'CS301', assignments_completed: 3, total_assignments: 5, average_score: 88, highest_score: 95, lowest_score: 82 },
        { course_id: 3, course_name: 'Algorithm Design', course_code: 'CS202', assignments_completed: 4, total_assignments: 9, average_score: 78, highest_score: 85, lowest_score: 72 },
        { course_id: 4, course_name: 'Database Systems', course_code: 'CS303', assignments_completed: 9, total_assignments: 10, average_score: 89, highest_score: 90, lowest_score: 88 },
    ];

    const displayGrades = grades.length > 0 ? grades : mockGrades;

    const filteredGrades = displayGrades.filter((grade: Grade) => {
        const matchesSearch = grade.assignment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            grade.course_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse = selectedCourse === 'all' || grade.course_id.toString() === selectedCourse;
        return matchesSearch && matchesCourse;
    }).sort((a: Grade, b: Grade) => {
        if (sortBy === 'date') return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime();
        if (sortBy === 'score-high') return b.percentage - a.percentage;
        if (sortBy === 'score-low') return a.percentage - b.percentage;
        return 0;
    });

    const overallAverage = Math.round(displayGrades.reduce((acc: number, g: Grade) => acc + g.percentage, 0) / displayGrades.length);
    const highestGrade = Math.max(...displayGrades.map((g: Grade) => g.percentage));
    const totalAssignments = displayGrades.length;

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        if (percentage >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeLetter = (percentage: number) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const columns = [
        {
            key: 'assignment_title',
            header: 'Assignment',
            cell: (grade: Grade) => (
                <div>
                    <p className="font-medium text-gray-900">{grade.assignment_title}</p>
                    <p className="text-sm text-gray-500">{grade.course_code} - {grade.course_name}</p>
                </div>
            ),
        },
        {
            key: 'submitted_at',
            header: 'Submitted',
            cell: (grade: Grade) => (
                <span className="text-sm text-gray-600">
                    {format(new Date(grade.submitted_at), 'MMM dd, yyyy')}
                </span>
            ),
        },
        {
            key: 'tests_passed',
            header: 'Tests',
            cell: (grade: Grade) => (
                <span className="text-sm">
                    {grade.tests_passed}/{grade.total_tests}
                </span>
            ),
        },
        {
            key: 'percentage',
            header: 'Score',
            cell: (grade: Grade) => (
                <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getGradeColor(grade.percentage)}`}>
                        {grade.percentage}%
                    </span>
                    <Badge variant={grade.percentage >= 80 ? 'success' : grade.percentage >= 60 ? 'warning' : 'danger'}>
                        {getGradeLetter(grade.percentage)}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'id',
            header: 'Actions',
            cell: (grade: Grade) => (
                <Link href={`/student/assignments/${grade.assignment_id}`}>
                    <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
                            <p className="text-gray-500 mt-1">Track your academic performance</p>
                        </div>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export Grades
                        </Button>
                    </div>

                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-[#862733]/10 flex items-center justify-center">
                                        <Award className="w-6 h-6 text-[#862733]" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-[#862733]">{overallAverage}%</p>
                                        <p className="text-sm text-gray-500">Overall Average</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-green-600">{highestGrade}%</p>
                                        <p className="text-sm text-gray-500">Highest Score</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <FileCode className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-blue-600">{totalAssignments}</p>
                                        <p className="text-sm text-gray-500">Graded Assignments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-purple-600">{mockCourseGrades.length}</p>
                                        <p className="text-sm text-gray-500">Active Courses</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Performance</CardTitle>
                            <CardDescription>Average scores by course</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mockCourseGrades.map((course) => (
                                    <div key={course.course_id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{course.course_name}</p>
                                                <p className="text-sm text-gray-500">{course.course_code}</p>
                                            </div>
                                            <Badge
                                                variant={course.average_score >= 80 ? 'success' : course.average_score >= 60 ? 'warning' : 'danger'}
                                                className="text-lg px-3 py-1"
                                            >
                                                {course.average_score}%
                                            </Badge>
                                        </div>
                                        <Progress
                                            value={course.average_score}
                                            variant={course.average_score >= 80 ? 'success' : course.average_score >= 60 ? 'warning' : 'danger'}
                                            className="mb-2"
                                        />
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{course.assignments_completed}/{course.total_assignments} completed</span>
                                            <span>High: {course.highest_score}% • Low: {course.lowest_score}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grades Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>All Grades</CardTitle>
                                    <CardDescription>Detailed view of all graded assignments</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-48"
                                        />
                                    </div>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#862733]/20"
                                    >
                                        <option value="all">All Courses</option>
                                        {mockCourseGrades.map((course) => (
                                            <option key={course.course_id} value={course.course_id}>{course.course_name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#862733]/20"
                                    >
                                        <option value="date">Latest First</option>
                                        <option value="score-high">Highest Score</option>
                                        <option value="score-low">Lowest Score</option>
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-12 text-gray-500">Loading grades...</div>
                            ) : filteredGrades.length > 0 ? (
                                <DataTable columns={columns} data={filteredGrades} />
                            ) : (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
                                    <p className="text-gray-500">
                                        {searchQuery ? 'Try adjusting your search criteria' : 'No graded assignments yet.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
