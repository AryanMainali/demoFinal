'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Award,
    Target,
    Clock,
    BookOpen,
    FileCode,
    CheckCircle,
    AlertCircle,
    Calendar,
    Zap,
    BarChart2,
    Activity,
    Trophy,
    Flame
} from 'lucide-react';

export default function StudentProgressPage() {
    const { data: stats } = useQuery({
        queryKey: ['student-progress'],
        queryFn: () => apiClient.getDashboardStats(),
    });

    // Mock data
    const mockProgress = {
        overall_progress: 72,
        total_assignments_completed: 22,
        total_assignments: 32,
        average_score: 85,
        current_streak: 7,
        longest_streak: 14,
        total_coding_time: '48h 32m',
        languages_used: ['Python', 'JavaScript', 'Java', 'SQL'],
        weekly_activity: [4, 6, 3, 5, 7, 2, 5],
        monthly_scores: [78, 82, 85, 88, 85, 90, 87, 92, 85, 88, 90, 85],
        skills: [
            { name: 'Data Structures', level: 85, color: 'bg-blue-500' },
            { name: 'Algorithms', level: 72, color: 'bg-green-500' },
            { name: 'Web Development', level: 90, color: 'bg-purple-500' },
            { name: 'Database', level: 78, color: 'bg-orange-500' },
            { name: 'Problem Solving', level: 88, color: 'bg-pink-500' },
        ],
        achievements: [
            { id: 1, title: 'First Submission', description: 'Complete your first assignment', icon: '🎯', earned: true, date: '2025-01-15' },
            { id: 2, title: 'Perfect Score', description: 'Get 100% on an assignment', icon: '⭐', earned: true, date: '2025-01-18' },
            { id: 3, title: 'Week Warrior', description: '7-day submission streak', icon: '🔥', earned: true, date: '2025-01-20' },
            { id: 4, title: 'Code Master', description: 'Complete 25 assignments', icon: '🏆', earned: false, progress: 22 },
            { id: 5, title: 'Polyglot', description: 'Use 5 programming languages', icon: '🌐', earned: false, progress: 4 },
            { id: 6, title: 'Early Bird', description: 'Submit 10 assignments before deadline', icon: '🐦', earned: true, date: '2025-01-22' },
        ],
        recent_milestones: [
            { title: 'Completed Data Structures Module', date: '2025-01-25', type: 'completion' },
            { title: 'Achieved 90% average in Web Dev', date: '2025-01-23', type: 'achievement' },
            { title: 'Started Algorithm Design course', date: '2025-01-20', type: 'start' },
        ],
    };

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
                            <p className="text-gray-500 mt-1">Track your learning journey and achievements</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
                                <Flame className="w-5 h-5 text-orange-600" />
                                <span className="font-bold text-orange-600">{mockProgress.current_streak} Day Streak</span>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <Card className="bg-gradient-to-r from-[#862733] to-[#a13040] text-white">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold mb-2">Overall Progress</h2>
                                    <p className="text-white/80 mb-4">
                                        You've completed {mockProgress.total_assignments_completed} of {mockProgress.total_assignments} assignments
                                    </p>
                                    <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-white h-full rounded-full transition-all duration-500"
                                            style={{ width: `${mockProgress.overall_progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-white/70 mt-2">{mockProgress.overall_progress}% complete</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center px-4 py-3 bg-white/10 rounded-lg">
                                        <p className="text-3xl font-bold">{mockProgress.average_score}%</p>
                                        <p className="text-sm text-white/70">Avg Score</p>
                                    </div>
                                    <div className="text-center px-4 py-3 bg-white/10 rounded-lg">
                                        <p className="text-3xl font-bold">{mockProgress.current_streak}</p>
                                        <p className="text-sm text-white/70">Day Streak</p>
                                    </div>
                                    <div className="text-center px-4 py-3 bg-white/10 rounded-lg">
                                        <p className="text-3xl font-bold">{mockProgress.total_coding_time.split(' ')[0]}</p>
                                        <p className="text-sm text-white/70">Hours Coded</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Skills Progress */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-[#862733]" />
                                    Skills Progress
                                </CardTitle>
                                <CardDescription>Your proficiency in different areas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {mockProgress.skills.map((skill, index) => (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">{skill.name}</span>
                                                <span className="text-sm text-gray-500">{skill.level}%</span>
                                            </div>
                                            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${skill.color} rounded-full transition-all duration-500`}
                                                    style={{ width: `${skill.level}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weekly Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-[#862733]" />
                                    Weekly Activity
                                </CardTitle>
                                <CardDescription>Submissions this week</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between h-32 gap-2">
                                    {mockProgress.weekly_activity.map((count, index) => (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div
                                                className="w-full bg-[#862733]/20 rounded-t hover:bg-[#862733]/30 transition-colors"
                                                style={{ height: `${(count / 7) * 100}%`, minHeight: '8px' }}
                                            >
                                                <div
                                                    className="w-full bg-[#862733] rounded-t transition-all duration-300"
                                                    style={{ height: '100%' }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">{weekDays[index]}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Total this week</span>
                                    <span className="font-bold text-[#862733]">
                                        {mockProgress.weekly_activity.reduce((a, b) => a + b, 0)} submissions
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Achievements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[#862733]" />
                                Achievements
                            </CardTitle>
                            <CardDescription>Badges and milestones you've earned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {mockProgress.achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`p-4 rounded-lg text-center transition-all ${achievement.earned
                                            ? 'bg-[#862733]/10 border-2 border-[#862733]/30'
                                            : 'bg-gray-100 opacity-60'
                                            }`}
                                    >
                                        <div className="text-4xl mb-2">{achievement.icon}</div>
                                        <h4 className="font-medium text-sm text-gray-900 mb-1">{achievement.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                                        {achievement.earned ? (
                                            <Badge variant="success" className="text-xs">Earned</Badge>
                                        ) : (
                                            <div>
                                                <Progress value={(achievement.progress || 0) / 25 * 100} size="sm" />
                                                <p className="text-xs text-gray-500 mt-1">{achievement.progress}/25</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Languages Used */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCode className="w-5 h-5 text-[#862733]" />
                                    Languages Used
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {mockProgress.languages_used.map((lang, index) => (
                                        <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span>Use 1 more language to unlock the "Polyglot" badge!</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Milestones */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#862733]" />
                                    Recent Milestones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockProgress.recent_milestones.map((milestone, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.type === 'completion' ? 'bg-green-100' :
                                                milestone.type === 'achievement' ? 'bg-yellow-100' : 'bg-blue-100'
                                                }`}>
                                                {milestone.type === 'completion' ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : milestone.type === 'achievement' ? (
                                                    <Award className="w-4 h-4 text-yellow-600" />
                                                ) : (
                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{milestone.title}</p>
                                                <p className="text-sm text-gray-500">{milestone.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-2xl font-bold text-gray-900">{mockProgress.total_coding_time}</p>
                                <p className="text-sm text-gray-500">Total Coding Time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Flame className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                                <p className="text-2xl font-bold text-gray-900">{mockProgress.longest_streak} days</p>
                                <p className="text-sm text-gray-500">Longest Streak</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                                <p className="text-2xl font-bold text-gray-900">
                                    {mockProgress.achievements.filter(a => a.earned).length}
                                </p>
                                <p className="text-sm text-gray-500">Badges Earned</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                <p className="text-2xl font-bold text-gray-900">+7%</p>
                                <p className="text-sm text-gray-500">This Month</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
