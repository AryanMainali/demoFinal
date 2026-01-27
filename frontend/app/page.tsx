import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">K</span>
                        </div>
                        <h1 className="text-2xl font-bold text-primary">Kriterion</h1>
                    </div>
                    <nav className="space-x-4">
                        <Link href="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Get Started</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-bold text-gray-900 mb-6">
                        Automated Grading System
                        <br />
                        <span className="text-primary">for Programming Assignments</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Streamline your grading workflow with automated testing, comprehensive rubrics,
                        and detailed feedback for students. Built for educators, designed for excellence.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-8">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button size="lg" variant="outline" className="text-lg px-8">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div id="features" className="mt-24 grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Automated Testing</h3>
                        <p className="text-gray-600">
                            Run comprehensive test suites with public and private tests. Instant feedback for students.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
                        <p className="text-gray-600">
                            Track student progress, identify common errors, and visualize grade distributions.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Secure Sandbox</h3>
                        <p className="text-gray-600">
                            Execute student code safely in isolated containers. Protected against malicious code.
                        </p>
                    </div>
                </div>

                {/* Supported Languages */}
                <div className="mt-24 text-center">
                    <h3 className="text-2xl font-bold mb-8">Supported Programming Languages</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript'].map((lang) => (
                            <div key={lang} className="bg-white px-6 py-3 rounded-full shadow-md font-medium">
                                {lang}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white mt-24">
                <div className="container mx-auto px-4 py-8 text-center text-gray-600">
                    <p>&copy; 2026 Kriterion. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
