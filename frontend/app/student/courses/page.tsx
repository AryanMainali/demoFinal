'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen,
    Search,
    Users,
    Calendar,
    Clock,
    FileCode,
    ChevronRight,
    Star,
    Filter
} from 'lucide-react';

interface Course {
    id: number;
    name: string;
    code: string;
    description: string;
    instructor_name: string;
    semester: string;
    year: number;
    students_count: number;
    assignments_count: number;
    completed_assignments: number;
    progress: number;
    next_due?: string;
    cover_color?: string;
}

export default function StudentCoursesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => apiClient.getCourses(),
    });

    // Mock data
    const mockCourses: Course[] = [
        {
            id: 1,
            name: 'Data Structures and Algorithms',
            code: 'CS201',
            description: 'Learn fundamental data structures and algorithms for efficient problem solving.',
            instructor_name: 'Dr. Sarah Smith',
            semester: 'Spring',
            year: 2025,
            students_count: 45,
            assignments_count: 8,
            completed_assignments: 6,
            progress: 75,
            next_due: '2 days',
            cover_color: 'bg-blue-500',
        },
        {
            id: 2,
            name: 'Web Development',
            code: 'CS301',
            description: 'Full-stack web development with modern technologies and frameworks.',
            instructor_name: 'Prof. Michael Johnson',
            semester: 'Spring',
            year: 2025,
            students_count: 38,
            assignments_count: 5,
            completed_assignments: 3,
            progress: 60,
            next_due: '5 days',
            cover_color: 'bg-green-500',
        },
        {
            id: 3,
            name: 'Algorithm Design',
            code: 'CS202',
            description: 'Advanced algorithm design techniques and complexity analysis.',
            instructor_name: 'Dr. Emily Williams',
            semester: 'Spring',
            year: 2025,
            students_count: 42,
            assignments_count: 9,
            completed_assignments: 4,
            progress: 45,
            next_due: '1 day',
            cover_color: 'bg-purple-500',
        },
        {
            id: 4,
            name: 'Database Systems',
            code: 'CS303',
            description: 'Relational databases, SQL, and database design principles.',
            instructor_name: 'Prof. Robert Brown',
            semester: 'Spring',
            year: 2025,
            students_count: 50,
            assignments_count: 10,
            completed_assignments: 9,
            progress: 90,
            next_due: '1 week',
            cover_color: 'bg-orange-500',
        },
    ];

    const displayCourses = courses.length > 0 ? courses : mockCourses;

    const filteredCourses = displayCourses.filter((course: Course) => {
        const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSemester = filterSemester === 'all' || course.semester.toLowerCase() === filterSemester;
        return matchesSearch && matchesSemester;
    });

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
                            <p className="text-gray-500 mt-1">
                                {filteredCourses.length} courses enrolled
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-64"
                                />
                            </div>
                            <select
                                value={filterSemester}
                                onChange={(e) => setFilterSemester(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#862733]/20"
                            >
                                <option value="all">All Semesters</option>
                                <option value="spring">Spring</option>
                                <option value="fall">Fall</option>
                                <option value="summer">Summer</option>
                            </select>
                        </div>
                    </div>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{filteredCourses.length}</p>
                                        <p className="text-sm text-gray-500">Active Courses</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <FileCode className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {filteredCourses.reduce((acc: number, c: Course) => acc + (c.completed_assignments || 0), 0)}
                                        </p>
                                        <p className="text-sm text-gray-500">Completed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {filteredCourses.reduce((acc: number, c: Course) => acc + (c.assignments_count || 0) - (c.completed_assignments || 0), 0)}
                                        </p>
                                        <p className="text-sm text-gray-500">Pending</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Star className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {Math.round(filteredCourses.reduce((acc: number, c: Course) => acc + (c.progress || 0), 0) / filteredCourses.length)}%
                                        </p>
                                        <p className="text-sm text-gray-500">Avg Progress</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Courses Grid */}
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading courses...</div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCourses.map((course: Course) => (
                                <Link key={course.id} href={`/student/courses/${course.id}`}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                                        <div className={`h-3 ${course.cover_color || 'bg-[#862733]'} rounded-t-lg`} />
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="outline" className="mb-2">{course.code}</Badge>
                                                    <CardTitle className="text-lg group-hover:text-[#862733] transition-colors">
                                                        {course.name}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {course.instructor_name}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={course.progress >= 80 ? 'success' : course.progress >= 50 ? 'warning' : 'info'}>
                                                    {course.progress}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                {course.description}
                                            </p>

                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-500">Progress</span>
                                                    <span className="font-medium">{course.completed_assignments}/{course.assignments_count}</span>
                                                </div>
                                                <Progress value={course.progress} size="sm" />
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {course.students_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileCode className="w-4 h-4" />
                                                        {course.assignments_count}
                                                    </span>
                                                </div>
                                                {course.next_due && (
                                                    <span className="flex items-center gap-1 text-yellow-600">
                                                        <Clock className="w-4 h-4" />
                                                        Due {course.next_due}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                                <p className="text-gray-500">
                                    {searchQuery ? 'Try adjusting your search criteria' : 'You are not enrolled in any courses yet.'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
