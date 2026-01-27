'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs } from '@/components/ui/tabs';
import {
    FileCode,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Play,
    Send,
    ArrowLeft,
    BookOpen,
    Code,
    Terminal,
    Download,
    RotateCcw,
    Eye,
    Loader2,
    Info,
    Award
} from 'lucide-react';

export default function AssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const assignmentId = params.id as string;

    const [code, setCode] = useState('');
    const [activeTab, setActiveTab] = useState('instructions');
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<any[]>([]);

    // Fetch assignment details
    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: () => apiClient.getAssignment(Number(assignmentId)),
    });

    // Mock assignment data
    const mockAssignment = {
        id: Number(assignmentId),
        title: 'Binary Search Tree Implementation',
        description: 'Implement a binary search tree (BST) data structure with the following operations: insert, search, delete, and inorder traversal.',
        course_name: 'Data Structures',
        course_code: 'CS201',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        max_score: 100,
        language: 'Python',
        difficulty: 'medium',
        submission_count: 1,
        max_submissions: 5,
        status: 'pending',
        instructions: `
## Assignment Overview

Implement a Binary Search Tree (BST) class in Python with the following methods:

### Required Methods

1. **insert(value)** - Insert a new value into the BST
2. **search(value)** - Search for a value and return True if found, False otherwise
3. **delete(value)** - Delete a value from the BST
4. **inorder()** - Return a list of values in inorder traversal

### Example Usage

\`\`\`python
bst = BinarySearchTree()
bst.insert(50)
bst.insert(30)
bst.insert(70)
print(bst.inorder())  # Output: [30, 50, 70]
print(bst.search(30))  # Output: True
bst.delete(30)
print(bst.inorder())  # Output: [50, 70]
\`\`\`

### Grading Criteria

- **Correctness (60%)**: All test cases pass
- **Code Quality (20%)**: Clean, readable code with proper naming
- **Efficiency (20%)**: Optimal time complexity for each operation
        `,
        starter_code: `class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        # TODO: Implement insert operation
        pass
    
    def search(self, value):
        # TODO: Implement search operation
        pass
    
    def delete(self, value):
        # TODO: Implement delete operation
        pass
    
    def inorder(self):
        # TODO: Implement inorder traversal
        pass
`,
        test_cases: [
            { id: 1, name: 'Test Insert', points: 20, passed: null },
            { id: 2, name: 'Test Search', points: 20, passed: null },
            { id: 3, name: 'Test Delete', points: 30, passed: null },
            { id: 4, name: 'Test Inorder', points: 15, passed: null },
            { id: 5, name: 'Test Edge Cases', points: 15, passed: null },
        ],
        previous_submissions: [
            { id: 1, submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), score: 45, passed_tests: 2, total_tests: 5 },
        ],
    };

    const displayAssignment = assignment || mockAssignment;

    useEffect(() => {
        if (displayAssignment.starter_code) {
            setCode(displayAssignment.starter_code);
        }
    }, [displayAssignment]);

    const submitMutation = useMutation({
        mutationFn: async (codeToSubmit: string) => {
            // Simulate API call
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        score: 75,
                        test_results: [
                            { id: 1, name: 'Test Insert', passed: true, points: 20 },
                            { id: 2, name: 'Test Search', passed: true, points: 20 },
                            { id: 3, name: 'Test Delete', passed: false, points: 0, error: 'Expected [50, 70] but got [30, 50, 70]' },
                            { id: 4, name: 'Test Inorder', passed: true, points: 15 },
                            { id: 5, name: 'Test Edge Cases', passed: true, points: 15 },
                        ],
                    });
                }, 3000);
            });
        },
        onSuccess: (data: any) => {
            setTestResults(data.test_results);
            setActiveTab('results');
            queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
        },
    });

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);

        // Simulate running code
        setTimeout(() => {
            setOutput(`Running code...
            
[30, 50, 70]
True

Execution completed successfully.
Time: 0.023s
Memory: 12.4 MB`);
            setIsRunning(false);
        }, 2000);
    };

    const handleSubmit = () => {
        submitMutation.mutate(code);
    };

    const tabs = [
        { id: 'instructions', label: 'Instructions', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'code', label: 'Code Editor', icon: <Code className="w-4 h-4" /> },
        { id: 'results', label: 'Results', icon: <Award className="w-4 h-4" /> },
        { id: 'submissions', label: 'Submissions', icon: <FileCode className="w-4 h-4" /> },
    ];

    const passedTests = testResults.filter(t => t.passed).length;
    const totalScore = testResults.reduce((acc, t) => acc + (t.passed ? t.points : 0), 0);

    if (isLoading) {
        return (
            <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="w-8 h-8 animate-spin text-[#862733]" />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{displayAssignment.course_code}</Badge>
                                    <Badge variant={displayAssignment.difficulty === 'hard' ? 'danger' : displayAssignment.difficulty === 'medium' ? 'warning' : 'success'}>
                                        {displayAssignment.difficulty}
                                    </Badge>
                                    <Badge variant="info">{displayAssignment.language}</Badge>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">{displayAssignment.title}</h1>
                                <p className="text-gray-500 mt-1">{displayAssignment.course_name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Calendar className="w-4 h-4" />
                                Due {format(new Date(displayAssignment.due_date), 'MMM dd, yyyy h:mm a')}
                            </div>
                            <p className="text-sm text-gray-500">
                                {displayAssignment.submission_count}/{displayAssignment.max_submissions} submissions used
                            </p>
                        </div>
                    </div>

                    {/* Alert for due soon */}
                    {new Date(displayAssignment.due_date) > new Date() &&
                        new Date(displayAssignment.due_date) < new Date(Date.now() + 1000 * 60 * 60 * 24) && (
                            <Alert type="warning" title="Due Soon">
                                This assignment is due in less than 24 hours. Make sure to submit before the deadline.
                            </Alert>
                        )}

                    {/* Tabs */}
                    <Card>
                        <CardContent className="p-4">
                            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                        </CardContent>
                    </Card>

                    {/* Tab Content */}
                    {activeTab === 'instructions' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assignment Instructions</CardTitle>
                                <CardDescription>{displayAssignment.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{
                                        __html: displayAssignment.instructions
                                            .replace(/## /g, '<h2 class="text-lg font-semibold mt-6 mb-3">')
                                            .replace(/### /g, '<h3 class="text-md font-medium mt-4 mb-2">')
                                            .replace(/\n/g, '<br>')
                                            .replace(/```python/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"><code>')
                                            .replace(/```/g, '</code></pre>')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    }} />
                                </div>

                                <div className="mt-6 pt-6 border-t">
                                    <h3 className="font-medium text-gray-900 mb-4">Test Cases</h3>
                                    <div className="space-y-2">
                                        {displayAssignment.test_cases.map((test: any) => (
                                            <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm">{test.name}</span>
                                                <Badge variant="outline">{test.points} pts</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <Button onClick={() => setActiveTab('code')}>
                                        <Code className="w-4 h-4 mr-2" />
                                        Start Coding
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'code' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Code Editor */}
                            <Card className="lg:col-span-1">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Code className="w-5 h-5" />
                                            Code Editor
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setCode(displayAssignment.starter_code)}>
                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full h-96 font-mono text-sm p-4 bg-gray-900 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#862733]"
                                        spellCheck={false}
                                    />
                                    <div className="flex items-center justify-between mt-4">
                                        <Button variant="outline" onClick={handleRunCode} disabled={isRunning}>
                                            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                            Run Code
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={submitMutation.isPending || displayAssignment.submission_count >= displayAssignment.max_submissions}
                                        >
                                            {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                            Submit
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Output Panel */}
                            <Card className="lg:col-span-1">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <Terminal className="w-5 h-5" />
                                        Output
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-96 bg-gray-900 rounded-lg p-4 overflow-auto">
                                        {isRunning ? (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Running...
                                            </div>
                                        ) : output ? (
                                            <pre className="text-sm text-gray-100 whitespace-pre-wrap">{output}</pre>
                                        ) : (
                                            <p className="text-gray-500">Click "Run Code" to see output here...</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Test Results</CardTitle>
                                <CardDescription>
                                    {testResults.length > 0
                                        ? `${passedTests}/${testResults.length} tests passed • Score: ${totalScore}/${displayAssignment.max_score}`
                                        : 'Submit your code to see test results'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {testResults.length > 0 ? (
                                    <>
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Overall Score</span>
                                                <span className="text-lg font-bold text-[#862733]">{totalScore}%</span>
                                            </div>
                                            <Progress
                                                value={totalScore}
                                                variant={totalScore >= 80 ? 'success' : totalScore >= 60 ? 'warning' : 'danger'}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            {testResults.map((test) => (
                                                <div
                                                    key={test.id}
                                                    className={`p-4 rounded-lg border ${test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {test.passed ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                            )}
                                                            <span className="font-medium">{test.name}</span>
                                                        </div>
                                                        <Badge variant={test.passed ? 'success' : 'danger'}>
                                                            {test.passed ? `+${test.points}` : '0'} pts
                                                        </Badge>
                                                    </div>
                                                    {test.error && (
                                                        <p className="mt-2 text-sm text-red-600">{test.error}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                                        <p className="text-gray-500 mb-4">Submit your code to run tests and see results.</p>
                                        <Button onClick={() => setActiveTab('code')}>
                                            <Code className="w-4 h-4 mr-2" />
                                            Go to Code Editor
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'submissions' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submission History</CardTitle>
                                <CardDescription>
                                    {displayAssignment.submission_count}/{displayAssignment.max_submissions} submissions used
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {displayAssignment.previous_submissions && displayAssignment.previous_submissions.length > 0 ? (
                                    <div className="space-y-4">
                                        {displayAssignment.previous_submissions.map((sub: any, index: number) => (
                                            <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#862733]/10 flex items-center justify-center text-[#862733] font-bold">
                                                        #{displayAssignment.previous_submissions.length - index}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            Submitted {format(new Date(sub.submitted_at), 'MMM dd, yyyy h:mm a')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {sub.passed_tests}/{sub.total_tests} tests passed
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-[#862733]">{sub.score}%</p>
                                                        <p className="text-sm text-gray-500">Score</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                                        <p className="text-gray-500">Submit your code to see your submission history.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
