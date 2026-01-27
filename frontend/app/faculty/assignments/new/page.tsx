'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Eye,
    Code,
    Calendar,
    FileText,
    Plus,
    Trash2,
    Play
} from 'lucide-react';

export default function NewAssignmentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const preselectedCourse = searchParams.get('course');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course_id: preselectedCourse || '',
        due_date: '',
        due_time: '23:59',
        max_score: 100,
        language: 'python',
        starter_code: '# Write your code here\n\ndef solution():\n    pass\n',
        instructions: '',
        time_limit: 5,
        memory_limit: 256,
    });

    const [testCases, setTestCases] = useState([
        { id: 1, input: '', expected_output: '', points: 10, is_hidden: false },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');

    const { data: courses = [] } = useQuery({
        queryKey: ['faculty-courses'],
        queryFn: () => apiClient.getCourses(),
    });

    const mockCourses = [
        { id: '1', code: 'CS101', name: 'Introduction to Programming' },
        { id: '2', code: 'CS201', name: 'Data Structures' },
        { id: '3', code: 'CS301', name: 'Database Systems' },
    ];

    const displayCourses = courses.length > 0 ? courses : mockCourses;

    const createMutation = useMutation({
        mutationFn: (data: any) => apiClient.createAssignment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
            setSuccessMessage('Assignment created successfully!');
            setTimeout(() => router.push('/faculty/assignments'), 1500);
        },
        onError: (error: any) => {
            setErrors({ submit: error.message || 'Failed to create assignment' });
        },
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const addTestCase = () => {
        setTestCases(prev => [
            ...prev,
            { id: Date.now(), input: '', expected_output: '', points: 10, is_hidden: false },
        ]);
    };

    const removeTestCase = (id: number) => {
        if (testCases.length > 1) {
            setTestCases(prev => prev.filter(tc => tc.id !== id));
        }
    };

    const updateTestCase = (id: number, field: string, value: any) => {
        setTestCases(prev =>
            prev.map(tc => (tc.id === id ? { ...tc, [field]: value } : tc))
        );
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.course_id) newErrors.course_id = 'Course is required';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.max_score <= 0) newErrors.max_score = 'Max score must be positive';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = {
            ...formData,
            due_date: `${formData.due_date}T${formData.due_time}:00`,
            test_cases: testCases,
            status: isDraft ? 'draft' : 'active',
        };

        createMutation.mutate(data);
    };

    const languages = [
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'cpp', label: 'C++' },
        { value: 'c', label: 'C' },
    ];

    const totalPoints = testCases.reduce((acc, tc) => acc + tc.points, 0);

    return (
        <ProtectedRoute allowedRoles={['FACULTY']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {successMessage && (
                        <Alert type="success" title="Success">
                            {successMessage}
                        </Alert>
                    )}

                    {errors.submit && (
                        <Alert type="error" title="Error">
                            {errors.submit}
                        </Alert>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
                            <p className="text-gray-500 mt-1">Create a new programming assignment</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e, false)}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Basic Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Basic Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Title *
                                            </label>
                                            <Input
                                                placeholder="e.g., Hello World Program"
                                                value={formData.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                className={errors.title ? 'border-red-500' : ''}
                                            />
                                            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description *
                                            </label>
                                            <textarea
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                                rows={4}
                                                placeholder="Describe the assignment..."
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                            />
                                            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Instructions (Markdown supported)
                                            </label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm"
                                                rows={6}
                                                placeholder="## Instructions&#10;&#10;1. Read the problem carefully&#10;2. Write your solution&#10;3. Test your code"
                                                value={formData.instructions}
                                                onChange={(e) => handleChange('instructions', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Starter Code */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Code className="w-5 h-5" />
                                            Starter Code
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm bg-gray-50"
                                            rows={10}
                                            value={formData.starter_code}
                                            onChange={(e) => handleChange('starter_code', e.target.value)}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Test Cases */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Play className="w-5 h-5" />
                                                Test Cases
                                            </CardTitle>
                                            <div className="text-sm text-gray-500">
                                                Total Points: {totalPoints}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {testCases.map((tc, index) => (
                                            <div key={tc.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Test Case {index + 1}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={tc.is_hidden}
                                                                onChange={(e) => updateTestCase(tc.id, 'is_hidden', e.target.checked)}
                                                                className="rounded border-gray-300 text-[#862733] focus:ring-[#862733]"
                                                            />
                                                            Hidden
                                                        </label>
                                                        {testCases.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeTestCase(tc.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Input</label>
                                                        <textarea
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm"
                                                            rows={3}
                                                            placeholder="Input for the test case"
                                                            value={tc.input}
                                                            onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Expected Output</label>
                                                        <textarea
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm"
                                                            rows={3}
                                                            placeholder="Expected output"
                                                            value={tc.expected_output}
                                                            onChange={(e) => updateTestCase(tc.id, 'expected_output', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-32">
                                                    <label className="block text-sm text-gray-600 mb-1">Points</label>
                                                    <Input
                                                        type="number"
                                                        value={tc.points}
                                                        onChange={(e) => updateTestCase(tc.id, 'points', parseInt(e.target.value) || 0)}
                                                        min={0}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={addTestCase}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Test Case
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Settings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Course *
                                            </label>
                                            <select
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent ${errors.course_id ? 'border-red-500' : 'border-gray-300'}`}
                                                value={formData.course_id}
                                                onChange={(e) => handleChange('course_id', e.target.value)}
                                            >
                                                <option value="">Select a course</option>
                                                {displayCourses.map((course: any) => (
                                                    <option key={course.id} value={course.id}>
                                                        {course.code} - {course.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.course_id && <p className="text-sm text-red-500 mt-1">{errors.course_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Programming Language
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#862733] focus:border-transparent"
                                                value={formData.language}
                                                onChange={(e) => handleChange('language', e.target.value)}
                                            >
                                                {languages.map(lang => (
                                                    <option key={lang.value} value={lang.value}>
                                                        {lang.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date *
                                            </label>
                                            <Input
                                                type="date"
                                                value={formData.due_date}
                                                onChange={(e) => handleChange('due_date', e.target.value)}
                                                className={errors.due_date ? 'border-red-500' : ''}
                                            />
                                            {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Time
                                            </label>
                                            <Input
                                                type="time"
                                                value={formData.due_time}
                                                onChange={(e) => handleChange('due_time', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Score
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.max_score}
                                                onChange={(e) => handleChange('max_score', parseInt(e.target.value) || 0)}
                                                min={1}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Execution Limits */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Execution Limits</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Time Limit (seconds)
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.time_limit}
                                                onChange={(e) => handleChange('time_limit', parseInt(e.target.value) || 5)}
                                                min={1}
                                                max={60}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Memory Limit (MB)
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.memory_limit}
                                                onChange={(e) => handleChange('memory_limit', parseInt(e.target.value) || 256)}
                                                min={16}
                                                max={1024}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Actions */}
                                <Card>
                                    <CardContent className="p-4 space-y-3">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={createMutation.isPending}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {createMutation.isPending ? 'Creating...' : 'Publish Assignment'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={(e) => handleSubmit(e, true)}
                                            disabled={createMutation.isPending}
                                        >
                                            Save as Draft
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
