'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    HelpCircle,
    Search,
    Book,
    MessageCircle,
    Mail,
    FileText,
    Video,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Zap,
    Code,
    Award,
    Clock,
    Users
} from 'lucide-react';

interface FAQ {
    id: number;
    question: string;
    answer: string;
    category: string;
}

export default function StudentHelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All Topics', icon: <Book className="w-4 h-4" /> },
        { id: 'getting-started', label: 'Getting Started', icon: <Zap className="w-4 h-4" /> },
        { id: 'assignments', label: 'Assignments', icon: <Code className="w-4 h-4" /> },
        { id: 'grades', label: 'Grades', icon: <Award className="w-4 h-4" /> },
        { id: 'technical', label: 'Technical', icon: <HelpCircle className="w-4 h-4" /> },
    ];

    const faqs: FAQ[] = [
        {
            id: 1,
            question: 'How do I submit an assignment?',
            answer: 'To submit an assignment: 1) Navigate to the Assignments page, 2) Click on the assignment you want to complete, 3) Write your code in the code editor, 4) Click "Run Code" to test locally, 5) When ready, click "Submit" to submit for grading. You can submit multiple times up to the allowed limit.',
            category: 'assignments',
        },
        {
            id: 2,
            question: 'What programming languages are supported?',
            answer: 'Kriterion supports multiple programming languages including Python, Java, JavaScript, C++, C, and SQL. The available language depends on the specific assignment. You can see the required language on each assignment\'s details page.',
            category: 'technical',
        },
        {
            id: 3,
            question: 'How is my code graded?',
            answer: 'Your code is automatically graded using test cases defined by your instructor. The grading process runs your code against various inputs and compares the output to expected results. Points are awarded based on how many test cases pass. Some assignments may also include manual review for code quality.',
            category: 'grades',
        },
        {
            id: 4,
            question: 'Can I resubmit an assignment?',
            answer: 'Yes, most assignments allow multiple submissions. The number of allowed submissions is shown on the assignment page. Only your last submission before the deadline will be graded. Check with your instructor for specific resubmission policies.',
            category: 'assignments',
        },
        {
            id: 5,
            question: 'What happens if I submit late?',
            answer: 'Late submissions may receive a penalty depending on your instructor\'s policy. Some assignments may not accept late submissions at all. Check the assignment details for specific late submission policies.',
            category: 'assignments',
        },
        {
            id: 6,
            question: 'How do I view my grades?',
            answer: 'Navigate to the Grades page from the sidebar to view all your graded assignments. You can see your score, feedback, and test results for each submission. Click on any grade to see detailed information.',
            category: 'grades',
        },
        {
            id: 7,
            question: 'My code runs locally but fails on submission. Why?',
            answer: 'Common reasons include: 1) Different Python/Java version, 2) Using libraries not available in the grading environment, 3) Hardcoded file paths, 4) Input/output format mismatch. Make sure to follow the exact specifications in the assignment.',
            category: 'technical',
        },
        {
            id: 8,
            question: 'How do I get started with my first assignment?',
            answer: 'First, go to the Assignments page and find an assignment. Read the instructions carefully, then use the starter code provided. Write your solution, test it using the "Run Code" button, and submit when ready.',
            category: 'getting-started',
        },
        {
            id: 9,
            question: 'What does the Day Streak mean?',
            answer: 'Your day streak shows consecutive days you\'ve submitted at least one assignment. It\'s a fun way to track your consistency. Keep submitting daily to maintain and grow your streak!',
            category: 'getting-started',
        },
        {
            id: 10,
            question: 'How do I contact my instructor?',
            answer: 'You can contact your instructor through your university\'s communication system or email. For technical issues with the platform, use the support options below.',
            category: 'getting-started',
        },
    ];

    const quickLinks = [
        { title: 'Video Tutorials', description: 'Watch step-by-step guides', icon: <Video className="w-5 h-5" />, href: '#' },
        { title: 'Documentation', description: 'Detailed platform guides', icon: <FileText className="w-5 h-5" />, href: '#' },
        { title: 'Contact Support', description: 'Get help from our team', icon: <Mail className="w-5 h-5" />, href: '#' },
        { title: 'Community Forum', description: 'Ask the community', icon: <Users className="w-5 h-5" />, href: '#' },
    ];

    const filteredFAQs = faqs.filter((faq) => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-[#862733]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HelpCircle className="w-8 h-8 text-[#862733]" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">How can we help you?</h1>
                        <p className="text-gray-500 mt-2">
                            Search our knowledge base or browse topics below
                        </p>
                        <div className="relative mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 py-3 text-lg"
                            />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickLinks.map((link, index) => (
                            <a
                                key={index}
                                href={link.href}
                                className="group"
                            >
                                <Card className="hover:shadow-md transition-shadow h-full">
                                    <CardContent className="p-4 text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#862733]/10 flex items-center justify-center group-hover:bg-[#862733]/20 transition-colors">
                                            <span className="text-[#862733]">{link.icon}</span>
                                        </div>
                                        <h3 className="font-medium text-gray-900">{link.title}</h3>
                                        <p className="text-sm text-gray-500">{link.description}</p>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${selectedCategory === category.id
                                    ? 'bg-[#862733] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category.icon}
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* FAQs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Frequently Asked Questions</CardTitle>
                            <CardDescription>
                                {filteredFAQs.length} questions found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredFAQs.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredFAQs.map((faq) => (
                                        <div
                                            key={faq.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#862733]/10 flex items-center justify-center flex-shrink-0">
                                                        <HelpCircle className="w-4 h-4 text-[#862733]" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{faq.question}</span>
                                                </div>
                                                {expandedFAQ === faq.id ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                            {expandedFAQ === faq.id && (
                                                <div className="px-4 pb-4 pt-0 ml-11">
                                                    <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
                                                    <Badge variant="outline" className="mt-3">{faq.category}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                                    <p className="text-gray-500">
                                        Try searching with different keywords or browse categories
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Support */}
                    <Card className="bg-[#862733]/5 border-[#862733]/20">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#862733] flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Still need help?</h3>
                                        <p className="text-gray-600">Our support team is ready to assist you</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Email Support
                                    </Button>
                                    <Button>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Live Chat
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Keyboard Shortcuts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyboard Shortcuts</CardTitle>
                            <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { keys: ['⌘', 'Enter'], action: 'Run code' },
                                    { keys: ['⌘', 'S'], action: 'Save code' },
                                    { keys: ['⌘', 'Shift', 'Enter'], action: 'Submit code' },
                                    { keys: ['⌘', '/'], action: 'Toggle comment' },
                                    { keys: ['⌘', 'Z'], action: 'Undo' },
                                    { keys: ['⌘', 'Shift', 'Z'], action: 'Redo' },
                                ].map((shortcut, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">{shortcut.action}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, i) => (
                                                <span key={i}>
                                                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                                                        {key}
                                                    </kbd>
                                                    {i < shortcut.keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
