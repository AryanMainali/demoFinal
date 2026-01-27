'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileCode,
    BookOpen,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

interface ScheduleItem {
    id: number;
    title: string;
    type: 'assignment' | 'quiz' | 'lecture';
    course_name: string;
    course_code: string;
    date: Date;
    time?: string;
    status?: 'pending' | 'completed' | 'overdue';
}

export default function StudentSchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'month'>('week');

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Mock schedule data
    const scheduleItems: ScheduleItem[] = [
        { id: 1, title: 'Binary Search Tree Due', type: 'assignment', course_name: 'Data Structures', course_code: 'CS201', date: addDays(new Date(), 1), time: '11:59 PM', status: 'pending' },
        { id: 2, title: 'REST API Project Due', type: 'assignment', course_name: 'Web Development', course_code: 'CS301', date: addDays(new Date(), 2), time: '11:59 PM', status: 'pending' },
        { id: 3, title: 'Algorithm Quiz', type: 'quiz', course_name: 'Algorithm Design', course_code: 'CS202', date: addDays(new Date(), 3), time: '2:00 PM', status: 'pending' },
        { id: 4, title: 'Linked List Lab', type: 'assignment', course_name: 'Data Structures', course_code: 'CS201', date: addDays(new Date(), -1), status: 'completed' },
        { id: 5, title: 'SQL Practice', type: 'assignment', course_name: 'Database Systems', course_code: 'CS303', date: addDays(new Date(), 5), time: '11:59 PM', status: 'pending' },
        { id: 6, title: 'Graph Algorithms Due', type: 'assignment', course_name: 'Algorithm Design', course_code: 'CS202', date: addDays(new Date(), -2), status: 'overdue' },
        { id: 7, title: 'React Components', type: 'assignment', course_name: 'Web Development', course_code: 'CS301', date: new Date(), time: '11:59 PM', status: 'pending' },
    ];

    const getItemsForDay = (day: Date) => {
        return scheduleItems.filter((item) => isSameDay(item.date, day));
    };

    const upcomingItems = scheduleItems
        .filter((item) => item.date >= new Date() && item.status !== 'completed')
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5);

    const overdueItems = scheduleItems.filter((item) => item.status === 'overdue');

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 border-green-300 text-green-800';
            case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
            default: return 'bg-blue-100 border-blue-300 text-blue-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'assignment': return <FileCode className="w-4 h-4" />;
            case 'quiz': return <BookOpen className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
                            <p className="text-gray-500 mt-1">
                                View your upcoming assignments and deadlines
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentDate(new Date())}
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Overdue Alert */}
                    {overdueItems.length > 0 && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <div>
                                        <p className="font-medium text-red-800">
                                            You have {overdueItems.length} overdue assignment{overdueItems.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-sm text-red-600">
                                            Please submit as soon as possible
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Calendar View */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{format(currentDate, 'MMMM yyyy')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Week Days Header */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Week Grid */}
                                <div className="grid grid-cols-7 gap-2">
                                    {weekDays.map((day) => {
                                        const dayItems = getItemsForDay(day);
                                        const today = isToday(day);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`min-h-[120px] p-2 rounded-lg border ${today ? 'border-[#862733] bg-[#862733]/5' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className={`text-sm font-medium mb-2 ${today ? 'text-[#862733]' : 'text-gray-600'}`}>
                                                    {format(day, 'd')}
                                                    {today && <Badge variant="primary" className="ml-2 text-xs">Today</Badge>}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayItems.slice(0, 3).map((item) => (
                                                        <Link
                                                            key={item.id}
                                                            href={`/student/assignments/${item.id}`}
                                                            className={`block p-1.5 rounded text-xs border ${getStatusColor(item.status)} hover:opacity-80 transition-opacity`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {getTypeIcon(item.type)}
                                                                <span className="truncate">{item.title}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    {dayItems.length > 3 && (
                                                        <p className="text-xs text-gray-500 pl-1">
                                                            +{dayItems.length - 3} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Upcoming */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-[#862733]" />
                                        Upcoming
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {upcomingItems.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/student/assignments/${item.id}`}
                                                className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${item.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {getTypeIcon(item.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{item.course_code}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {format(item.date, 'MMM dd')} {item.time && `at ${item.time}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        {upcomingItems.length === 0 && (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                                No upcoming deadlines!
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Legend */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Legend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                                            <span className="text-gray-600">Pending</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                                            <span className="text-gray-600">Completed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                                            <span className="text-gray-600">Overdue</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
