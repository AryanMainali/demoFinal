'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import {
    ArrowLeft,
    BookOpen,
    Clock,
    FileCode,
    CheckCircle,
    AlertCircle,
    User,
    Mail,
    Calendar,
    GraduationCap,
    TrendingUp,
    Download,
    ExternalLink,
    ClipboardList,
    FolderOpen,
    BarChart3
} from 'lucide-react';

interface Assignment {
    id: number;
    title: string;
    due_date: string;
    status: 'pending' | 'submitted' | 'graded' | 'overdue';
    score?: number;
    max_score: number;
}

interface Material {
    id: number;
    title: string;
    type: 'document' | 'video' | 'link';
    url: string;
}

interface CourseDetail {
    id: number;
    name: string;
    code: string;
    description: string;
    instructor: {
        name: string;
        email: string;
        avatar?: string;
    };
    semester: string;
    enrolled_date: string;
    progress: number;
    current_grade: string;
    grade_percentage: number;
    assignments: Assignment[];
    materials: Material[];
    schedule: {
        day: string;
        time: string;
    }[];
}

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id;
    const [activeTab, setActiveTab] = useState('overview');

    // Mock data - replace with actual API call
    const course: CourseDetail = {
        id: Number(courseId),
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'This course covers fundamental data structures (arrays, linked lists, trees, graphs) and algorithms (sorting, searching, dynamic programming) essential for software development and technical interviews.',
        instructor: {
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@university.edu',
            avatar: undefined
        },
        semester: 'Fall 2024',
        enrolled_date: '2024-09-01',
        progress: 65,
        current_grade: 'A',
        grade_percentage: 92,
        assignments: [
            { id: 1, title: 'Linked List Implementation', due_date: '2024-10-15', status: 'graded', score: 95, max_score: 100 },
            { id: 2, title: 'Binary Search Tree', due_date: '2024-10-22', status: 'graded', score: 88, max_score: 100 },
            { id: 3, title: 'Graph Traversal', due_date: '2024-10-29', status: 'submitted', max_score: 100 },
            { id: 4, title: 'Sorting Algorithms', due_date: '2024-11-05', status: 'pending', max_score: 100 },
            { id: 5, title: 'Dynamic Programming', due_date: '2024-11-12', status: 'pending', max_score: 100 },
            { id: 6, title: 'Final Project', due_date: '2024-12-01', status: 'pending', max_score: 200 },
        ],
        materials: [
            { id: 1, title: 'Course Syllabus', type: 'document', url: '#' },
            { id: 2, title: 'Lecture Notes - Week 1', type: 'document', url: '#' },
            { id: 3, title: 'Data Structures Overview', type: 'video', url: '#' },
            { id: 4, title: 'Big O Notation Cheatsheet', type: 'document', url: '#' },
            { id: 5, title: 'Additional Resources', type: 'link', url: '#' },
        ],
        schedule: [
            { day: 'Monday', time: '10:00 AM - 11:30 AM' },
            { day: 'Wednesday', time: '10:00 AM - 11:30 AM' },
            { day: 'Friday', time: '2:00 PM - 3:00 PM (Lab)' },
        ]
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'graded':
                return <Badge variant="success">Graded</Badge>;
            case 'submitted':
                return <Badge variant="info">Submitted</Badge>;
            case 'overdue':
                return <Badge variant="danger">Overdue</Badge>;
            default:
                return <Badge variant="warning">Pending</Badge>;
        }
    };

    const completedAssignments = course.assignments.filter(a => a.status === 'graded').length;
    const averageScore = course.assignments
        .filter(a => a.score !== undefined)
        .reduce((acc, a) => acc + (a.score! / a.max_score) * 100, 0) /
        (course.assignments.filter(a => a.score !== undefined).length || 1);

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Back Button & Header */}
                    <div className="flex items-start gap-4">
                        <Link href="/student/courses">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <Badge variant="primary">{course.code}</Badge>
                                <Badge variant="outline">{course.semester}</Badge>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mt-2">{course.name}</h1>
                            <p className="text-gray-500 mt-1">{course.description}</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#862733]/10 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-[#862733]" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Current Grade</p>
                                        <p className="text-2xl font-bold text-[#862733]">{course.current_grade}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Grade %</p>
                                        <p className="text-2xl font-bold text-gray-900">{course.grade_percentage}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Completed</p>
                                        <p className="text-2xl font-bold text-gray-900">{completedAssignments}/{course.assignments.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <FileCode className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Avg Score</p>
                                        <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(0)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Course Progress</span>
                                <span className="text-sm text-gray-500">{course.progress}% Complete</span>
                            </div>
                            <Progress value={course.progress} variant="default" />
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Card>
                        <CardContent className="p-4">
                            <Tabs
                                tabs={[
                                    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
                                    { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" />, count: course.assignments.length },
                                    { id: 'materials', label: 'Materials', icon: <FolderOpen className="w-4 h-4" /> },
                                    { id: 'grades', label: 'Grades', icon: <BarChart3 className="w-4 h-4" /> },
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </CardContent>
                    </Card>

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Instructor Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Instructor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={course.instructor.avatar}
                                            alt={course.instructor.name}
                                            fallback={course.instructor.name.split(' ').map(n => n[0]).join('')}
                                            size="lg"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{course.instructor.name}</p>
                                            <p className="text-sm text-gray-500">{course.instructor.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full mt-4">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contact Instructor
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Schedule */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Schedule</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {course.schedule.map((s, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{s.day}</p>
                                                    <p className="text-sm text-gray-500">{s.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Total Assignments</span>
                                            <span className="font-medium">{course.assignments.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Completed</span>
                                            <span className="font-medium text-green-600">{completedAssignments}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Pending</span>
                                            <span className="font-medium text-yellow-600">
                                                {course.assignments.filter(a => a.status === 'pending').length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Enrolled Since</span>
                                            <span className="font-medium">
                                                {new Date(course.enrolled_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>All Assignments</CardTitle>
                                <CardDescription>Track and submit your assignments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {course.assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#862733]/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assignment.status === 'graded' ? 'bg-green-100' :
                                                    assignment.status === 'submitted' ? 'bg-blue-100' :
                                                        assignment.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'
                                                    }`}>
                                                    <FileCode className={`w-5 h-5 ${assignment.status === 'graded' ? 'text-green-600' :
                                                        assignment.status === 'submitted' ? 'text-blue-600' :
                                                            assignment.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                                                        }`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{assignment.title}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {assignment.score !== undefined && (
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {assignment.score}/{assignment.max_score}
                                                    </span>
                                                )}
                                                {getStatusBadge(assignment.status)}
                                                <Link href={`/student/assignments/${assignment.id}`}>
                                                    <Button size="sm" variant={assignment.status === 'pending' ? 'default' : 'outline'}>
                                                        {assignment.status === 'pending' ? 'Start' : 'View'}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'materials' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Materials</CardTitle>
                                <CardDescription>Access lecture notes, videos, and resources</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {course.materials.map((material) => (
                                        <div
                                            key={material.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#862733]/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${material.type === 'document' ? 'bg-blue-100' :
                                                    material.type === 'video' ? 'bg-purple-100' : 'bg-green-100'
                                                    }`}>
                                                    {material.type === 'document' ? <FileCode className="w-5 h-5 text-blue-600" /> :
                                                        material.type === 'video' ? <BookOpen className="w-5 h-5 text-purple-600" /> :
                                                            <ExternalLink className="w-5 h-5 text-green-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{material.title}</p>
                                                    <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'grades' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Grade Breakdown</CardTitle>
                                <CardDescription>Your performance in this course</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {course.assignments.filter(a => a.score !== undefined).map((assignment) => (
                                        <div key={assignment.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900">{assignment.title}</span>
                                                <span className="text-sm text-gray-600">
                                                    {assignment.score}/{assignment.max_score} ({((assignment.score! / assignment.max_score) * 100).toFixed(0)}%)
                                                </span>
                                            </div>
                                            <Progress
                                                value={(assignment.score! / assignment.max_score) * 100}
                                                variant={
                                                    (assignment.score! / assignment.max_score) >= 0.9 ? 'success' :
                                                        (assignment.score! / assignment.max_score) >= 0.7 ? 'warning' : 'danger'
                                                }
                                            />
                                        </div>
                                    ))}
                                    {course.assignments.filter(a => a.score !== undefined).length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            No graded assignments yet
                                        </p>
                                    )}
                                </div>

                                {/* Grade Summary */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">Overall Grade</p>
                                            <p className="text-sm text-gray-500">Based on graded assignments</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-[#862733]">{course.current_grade}</p>
                                            <p className="text-sm text-gray-500">{course.grade_percentage}%</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}