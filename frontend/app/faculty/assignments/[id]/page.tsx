'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    Clock,
    Code,
    FileCode,
    Users,
    CheckCircle,
    Plus,
    Save,
    Eye,
    Copy,
    Play
} from 'lucide-react';

interface TestCase {
    id: string;
    name: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: number;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    instructions: string;
    course_id: string;
    course_name: string;
    course_code: string;
    language: string;
    starter_code: string;
    due_date: string;
    max_score: number;
    time_limit: number;
    memory_limit: number;
    status: 'draft' | 'published' | 'closed';
    created_at: string;
    test_cases: TestCase[];
    submissions_count: number;
    graded_count: number;
}

export default function AssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const assignmentId = params.id as string;

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [editForm, setEditForm] = useState<Partial<Assignment>>({});

    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: () => apiClient.getAssignment(parseInt(assignmentId)),
    });

    // Mock data
    const mockAssignment: Assignment = {
        id: assignmentId,
        title: 'Control Flow Statements',
        description: 'Practice using if-else statements, loops, and switch cases in Python.',
        instructions: `## Objective
Implement several functions that demonstrate your understanding of control flow in Python.

## Requirements

### Task 1: Number Classifier
Write a function \`classify_number(n)\` that returns:
- "positive" if n > 0
- "negative" if n < 0  
- "zero" if n == 0

### Task 2: FizzBuzz
Write a function \`fizzbuzz(n)\` that returns a list of strings from 1 to n where:
- Numbers divisible by 3 are replaced with "Fizz"
- Numbers divisible by 5 are replaced with "Buzz"
- Numbers divisible by both are replaced with "FizzBuzz"

### Task 3: Grade Calculator
Write a function \`calculate_grade(score)\` that returns:
- "A" for scores >= 90
- "B" for scores >= 80
- "C" for scores >= 70
- "D" for scores >= 60
- "F" for scores < 60

## Submission Guidelines
- Submit only the function implementations
- Do not include test code in your submission
- Ensure all functions are named exactly as specified`,
        course_id: '1',
        course_name: 'Introduction to Programming',
        course_code: 'CS101',
        language: 'python',
        starter_code: `def classify_number(n):
    # Your code here
    pass

def fizzbuzz(n):
    # Your code here
    pass

def calculate_grade(score):
    # Your code here
    pass`,
        due_date: '2026-02-05T23:59:00',
        max_score: 100,
        time_limit: 5,
        memory_limit: 128,
        status: 'published',
        created_at: '2026-01-15T10:00:00',
        test_cases: [
            { id: '1', name: 'Test classify_number positive', input: '5', expectedOutput: 'positive', isHidden: false, points: 10 },
            { id: '2', name: 'Test classify_number negative', input: '-3', expectedOutput: 'negative', isHidden: false, points: 10 },
            { id: '3', name: 'Test classify_number zero', input: '0', expectedOutput: 'zero', isHidden: false, points: 10 },
            { id: '4', name: 'Test fizzbuzz basic', input: '15', expectedOutput: '["1", "2", "Fizz", ...]', isHidden: false, points: 20 },
            { id: '5', name: 'Test fizzbuzz edge case', input: '1', expectedOutput: '["1"]', isHidden: true, points: 10 },
            { id: '6', name: 'Test grade A', input: '95', expectedOutput: 'A', isHidden: false, points: 10 },
            { id: '7', name: 'Test grade boundaries', input: '89', expectedOutput: 'B', isHidden: true, points: 15 },
            { id: '8', name: 'Test grade F', input: '45', expectedOutput: 'F', isHidden: true, points: 15 },
        ],
        submissions_count: 38,
        graded_count: 26,
    };

    const displayAssignment = assignment || mockAssignment;

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Assignment>) => apiClient.updateAssignment(parseInt(assignmentId), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
            setIsEditing(false);
            setSuccessMessage('Assignment updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => apiClient.deleteAssignment(parseInt(assignmentId)),
        onSuccess: () => {
            router.push('/faculty/assignments');
        },
    });

    const handleEdit = () => {
        setEditForm(displayAssignment);
        setIsEditing(true);
    };

    const handleSave = () => {
        updateMutation.mutate(editForm);
    };

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge variant="success">Published</Badge>;
            case 'draft':
                return <Badge variant="warning">Draft</Badge>;
            case 'closed':
                return <Badge variant="default">Closed</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getLanguageBadge = (lang: string) => {
        const colors: Record<string, string> = {
            python: 'bg-blue-100 text-blue-800',
            java: 'bg-orange-100 text-orange-800',
            javascript: 'bg-yellow-100 text-yellow-800',
            cpp: 'bg-purple-100 text-purple-800',
            c: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded text-sm font-medium ${colors[lang] || 'bg-gray-100 text-gray-800'}`}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </span>
        );
    };

    if (isLoading) {
        return (
            <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#862733]"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

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
                        <div className="flex items-center gap-4">
                            <Link href="/faculty/assignments">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{displayAssignment.title}</h1>
                                    {getStatusBadge(displayAssignment.status)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="default">{displayAssignment.course_code}</Badge>
                                    {getLanguageBadge(displayAssignment.language)}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/faculty/submissions?assignment=${assignmentId}`}>
                                <Button variant="outline">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Submissions
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={handleEdit}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
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
                                        <p className="text-2xl font-bold">{displayAssignment.submissions_count}</p>
                                        <p className="text-sm text-gray-500">Submissions</p>
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
                                        <p className="text-2xl font-bold">{displayAssignment.graded_count}</p>
                                        <p className="text-sm text-gray-500">Graded</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FileCode className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{displayAssignment.test_cases.length}</p>
                                        <p className="text-sm text-gray-500">Test Cases</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{format(new Date(displayAssignment.due_date), 'MMM d')}</p>
                                        <p className="text-sm text-gray-500">Due Date</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs
                        tabs={[
                            { id: 'details', label: 'Details' },
                            { id: 'instructions', label: 'Instructions' },
                            { id: 'starter-code', label: 'Starter Code' },
                            { id: 'test-cases', label: `Test Cases (${displayAssignment.test_cases.length})` }
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <TabPanel>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Course</label>
                                            <p className="mt-1">{displayAssignment.course_code} - {displayAssignment.course_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Language</label>
                                            <p className="mt-1">{getLanguageBadge(displayAssignment.language)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Due Date</label>
                                            <p className="mt-1">{format(new Date(displayAssignment.due_date), 'MMMM d, yyyy h:mm a')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Max Score</label>
                                            <p className="mt-1">{displayAssignment.max_score} points</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Time Limit</label>
                                            <p className="mt-1">{displayAssignment.time_limit} seconds</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Memory Limit</label>
                                            <p className="mt-1">{displayAssignment.memory_limit} MB</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Created</label>
                                            <p className="mt-1">{format(new Date(displayAssignment.created_at), 'MMMM d, yyyy')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Status</label>
                                            <p className="mt-1">{getStatusBadge(displayAssignment.status)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Description</label>
                                        <p className="mt-1 text-gray-700">{displayAssignment.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}

                    {/* Instructions Tab */}
                    {activeTab === 'instructions' && (
                        <TabPanel>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment Instructions</CardTitle>
                                    <CardDescription>Instructions shown to students</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose max-w-none">
                                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                                            {displayAssignment.instructions}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}

                    {/* Starter Code Tab */}
                    {activeTab === 'starter-code' && (
                        <TabPanel>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Starter Code</CardTitle>
                                            <CardDescription>Template code provided to students</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(displayAssignment.starter_code)}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
                                        <code>{displayAssignment.starter_code}</code>
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}

                    {/* Test Cases Tab */}
                    {activeTab === 'test-cases' && (
                        <TabPanel>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Test Cases</CardTitle>
                                    <CardDescription>
                                        {displayAssignment.test_cases.filter((t: TestCase) => t.isHidden).length} hidden, {displayAssignment.test_cases.filter((t: TestCase) => !t.isHidden).length} visible
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {displayAssignment.test_cases.map((testCase: TestCase, index: number) => (
                                            <div key={testCase.id} className="p-4 border rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Test {index + 1}: {testCase.name}</span>
                                                        {testCase.isHidden && <Badge variant="default">Hidden</Badge>}
                                                    </div>
                                                    <Badge variant="primary">{testCase.points} pts</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <label className="text-gray-500">Input</label>
                                                        <pre className="mt-1 p-2 bg-gray-100 rounded">{testCase.input}</pre>
                                                    </div>
                                                    <div>
                                                        <label className="text-gray-500">Expected Output</label>
                                                        <pre className="mt-1 p-2 bg-gray-100 rounded">{testCase.expectedOutput}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}

                    {/* Delete Modal */}
                    <Modal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        title="Delete Assignment"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Are you sure you want to delete <strong>{displayAssignment.title}</strong>?
                                This will also delete all {displayAssignment.submissions_count} submissions.
                            </p>
                            <p className="text-red-600 text-sm">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Assignment'}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
