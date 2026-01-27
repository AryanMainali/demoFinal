'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { BookOpen, Users, FileText, Clock, ArrowRight } from 'lucide-react';

export default function FacultyDashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => apiClient.getDashboardStats(),
    });

    const quickLinks = [
        {
            title: 'Manage Courses',
            description: 'Create and manage your courses',
            href: '/faculty/courses',
            icon: BookOpen,
            color: 'bg-blue-500'
        },
        {
            title: 'Assignments',
            description: 'Create and grade assignments',
            href: '/faculty/assignments',
            icon: FileText,
            color: 'bg-green-500'
        },
        {
            title: 'Submissions',
            description: 'Review student submissions',
            href: '/faculty/submissions',
            icon: Clock,
            color: 'bg-orange-500'
        },
        {
            title: 'Reports',
            description: 'View analytics and export grades',
            href: '/faculty/reports',
            icon: Users,
            color: 'bg-purple-500'
        },
    ];

    return (
        <ProtectedRoute allowedRoles={['FACULTY']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-r from-[#862733] to-[#a63344] rounded-2xl p-6 text-white">
                        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'Faculty'}! 👋</h1>
                        <p className="text-white/80 mt-1">
                            Here's an overview of your courses and pending tasks.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Courses"
                            value={isLoading ? '...' : stats?.total_courses || 0}
                            icon={BookOpen}
                            subtitle="Active courses"
                        />
                        <StatsCard
                            title="Total Students"
                            value={isLoading ? '...' : stats?.total_students || 0}
                            icon={Users}
                            subtitle="Enrolled students"
                        />
                        <StatsCard
                            title="Assignments"
                            value={isLoading ? '...' : stats?.total_assignments || 0}
                            icon={FileText}
                            subtitle="Total assignments"
                        />
                        <StatsCard
                            title="Pending Grading"
                            value={isLoading ? '...' : stats?.pending_grading || 0}
                            icon={Clock}
                            subtitle="Awaiting review"
                            trend={stats?.pending_grading > 0 ? { value: stats.pending_grading, label: 'need review' } : undefined}
                        />
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickLinks.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                        <CardContent className="p-6">
                                            <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center mb-4`}>
                                                <link.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">{link.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                                            <div className="flex items-center text-[#862733] text-sm mt-3 font-medium">
                                                Go to {link.title.toLowerCase()}
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
