'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { DashboardQuickLinks } from '@/components/ui/DashboardQuickLinks';
import { DashboardStatTile } from '@/components/ui/DashboardStatTile';
import {
    BookOpen,
    Users,
    FileText,
    Clock,
    ArrowRight,
    Code2,
    CalendarDays,
    Loader2,
    Plus,
    X,
    Send,
    CheckCircle2,
    GraduationCap,
    Sparkles,
    TrendingUp,
    Hourglass,
} from 'lucide-react';

// ── Pending language requests (localStorage) ───────────────────────────────

interface PendingLangRequest {
    id: string;
    language_name: string;
    requested_at: string;
}

const PENDING_KEY = 'kriterion_pending_lang_requests';

function loadPendingRequests(): PendingLangRequest[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}

function addPendingRequest(name: string) {
    const existing = loadPendingRequests();
    const req: PendingLangRequest = { id: Date.now().toString(), language_name: name, requested_at: new Date().toISOString() };
    localStorage.setItem(PENDING_KEY, JSON.stringify([...existing, req]));
    return req;
}

interface DashboardStats {
    total_courses: number;
    total_students: number;
    total_assignments: number;
    pending_grading: number;
}

interface FacultyCourse {
    id: number;
    code: string;
    name: string;
    student_count: number;
    assignment_count: number;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
}

interface ProgrammingLanguage {
    id: number;
    name: string;
    display_name: string;
    version: string;
    file_extension: string;
}

const LANG_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    python:     { bg: 'bg-sky-100',    text: 'text-sky-700',    ring: 'ring-sky-200' },
    java:       { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
    javascript: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-200' },
    typescript: { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200' },
    cpp:        { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' },
    c:          { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
    rust:       { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-200' },
    go:         { bg: 'bg-cyan-100',   text: 'text-cyan-700',   ring: 'ring-cyan-200' },
    ruby:       { bg: 'bg-rose-100',   text: 'text-rose-700',   ring: 'ring-rose-200' },
};

function getLangColor(name: string) {
    return LANG_COLORS[name.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200' };
}

// ── Request Language Modal ──────────────────────────────────────────────────

function RequestLanguageModal({
    onClose,
    existingLanguages,
    pendingRequests,
    onRequested,
}: {
    onClose: () => void;
    existingLanguages: ProgrammingLanguage[];
    pendingRequests: PendingLangRequest[];
    onRequested: (req: PendingLangRequest) => void;
}) {
    const [langName, setLangName] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const trimmed = langName.trim().toLowerCase();

    const alreadyAdded = trimmed.length > 0 &&
        existingLanguages.some((l) =>
            l.name.toLowerCase() === trimmed || l.display_name.toLowerCase() === trimmed
        );

    const alreadyRequested = trimmed.length > 0 && !alreadyAdded &&
        pendingRequests.some((r) => r.language_name.toLowerCase() === trimmed);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!langName.trim()) return;
        setLoading(true);
        try {
            await apiClient.requestLanguage({
                language_name: langName.trim(),
                notes: notes.trim() || undefined,
            });
        } catch {
            // show success regardless — admin receives via notification
        } finally {
            setLoading(false);
            const req = addPendingRequest(langName.trim());
            onRequested(req);
            setSuccess(true);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 z-10">
                {success ? (
                    <div className="flex flex-col items-center py-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Request Sent!</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Your language request has been sent to the admin for review. You'll be notified once it's approved.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Request a Language</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Admin will review and add it to your account</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Language Name <span className="text-red-500">*</span></label>
                                <input
                                    value={langName}
                                    onChange={(e) => setLangName(e.target.value)}
                                    placeholder="e.g. Python, Java, Rust…"
                                    required
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-300 transition ${
                                        alreadyAdded || alreadyRequested
                                            ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-400 bg-amber-50'
                                            : 'border-gray-200 focus:ring-primary/30 focus:border-primary'
                                    }`}
                                />
                                {alreadyAdded && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                        This language is already added to your account.
                                    </p>
                                )}
                                {alreadyRequested && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                                        <Hourglass className="w-3.5 h-3.5 flex-shrink-0" />
                                        You've already requested this — waiting for admin approval.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes for Admin <span className="text-gray-300">(optional)</span></label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Why do you need this language?"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-300 transition resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!langName.trim() || loading || alreadyAdded || alreadyRequested}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" /> Send Request
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function FacultyDashboard() {
    const { user } = useAuth();
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<PendingLangRequest[]>([]);

    useEffect(() => { setPendingRequests(loadPendingRequests()); }, []);

    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['faculty-dashboard'],
        queryFn: () => apiClient.getFacultyDashboard(),
    });

    const { data: courses = [] } = useQuery<FacultyCourse[]>({
        queryKey: ['faculty-courses-dashboard'],
        queryFn: () => apiClient.getFacultyCourses(),
    });

    const { data: languages = [] } = useQuery<ProgrammingLanguage[]>({
        queryKey: ['faculty-languages'],
        queryFn: () => apiClient.getFacultyLanguages(),
    });

    const firstName = user?.full_name?.split(' ')[0] || 'Professor';
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const today = new Date();
    const activeCourses = courses.filter((c) => c.status === 'active');
    const upcomingCourses = courses.filter((c) => c.status === 'upcoming');

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            {showRequestModal && (
                <RequestLanguageModal
                    onClose={() => setShowRequestModal(false)}
                    existingLanguages={languages}
                    pendingRequests={pendingRequests}
                    onRequested={(req) => setPendingRequests((prev) => [...prev, req])}
                />
            )}

            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary-700 px-5 py-4 text-white">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute bottom-0 right-16 w-24 h-24 bg-white/3 rounded-full" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-white/50 uppercase tracking-widest mb-0.5">
                            {format(today, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <h1 className="text-lg font-bold leading-tight">
                            {greeting}, {firstName}
                        </h1>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1.5">
                        {stats && !isLoading && stats.pending_grading > 0 && (
                            <Link
                                href="/faculty/courses"
                                className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                View courses <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                            <Sparkles className="w-3 h-3" />
                            <span>{activeCourses.length} active course{activeCourses.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <DashboardStatTile label="Active Courses"  value={stats?.total_courses}     icon={BookOpen}    loading={isLoading} color="text-blue-600"   bg="bg-blue-50"   />
                <DashboardStatTile label="Students"        value={stats?.total_students}     icon={Users}       loading={isLoading} color="text-violet-600" bg="bg-violet-50" sub="enrolled" />
                <DashboardStatTile label="Assignments"     value={stats?.total_assignments}  icon={FileText}    loading={isLoading} color="text-emerald-600" bg="bg-emerald-50" sub="created" />
                <DashboardStatTile
                    label="Pending"
                    value={stats?.pending_grading}
                    icon={Clock}
                    loading={isLoading}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    highlight={!!stats?.pending_grading && stats.pending_grading > 0}
                    sub="not past due"
                />
            </div>

            {/* Two-column: Courses + Languages */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 flex-1 min-h-0 overflow-hidden">
                {/* My Courses */}
                <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            My Courses
                            {activeCourses.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {activeCourses.length} active
                                </span>
                            )}
                        </h2>
                        <Link href="/faculty/courses" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                            </div>
                        ) : activeCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs gap-2">
                                <BookOpen className="w-8 h-8 text-gray-200" />
                                <span>No active courses</span>
                                <Link href="/faculty/courses/new" className="text-primary text-xs hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Create a course
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {activeCourses.map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/faculty/courses/${course.id}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {course.code.slice(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                                                {course.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-400">{course.code}</span>
                                                {course.end_date && (
                                                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                                                        <CalendarDays className="w-2.5 h-2.5" />
                                                        Ends {format(parseISO(course.end_date), 'MMM d')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                                                <Users className="w-3 h-3 text-gray-400" />
                                                {course.student_count}
                                            </span>
                                            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                                                <FileText className="w-3 h-3 text-gray-400" />
                                                {course.assignment_count}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-primary transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                                {upcomingCourses.length > 0 && (
                                    <div className="px-4 py-2 bg-gray-50/50">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Upcoming</p>
                                        {upcomingCourses.map((course) => (
                                            <Link
                                                key={course.id}
                                                href={`/faculty/courses/${course.id}`}
                                                className="flex items-center gap-2 py-1.5 group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-500 group-hover:text-primary transition-colors truncate">{course.name}</span>
                                                {course.start_date && (
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-auto">
                                                        {format(parseISO(course.start_date), 'MMM d')}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Languages */}
                <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-primary" />
                                Languages
                            </h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">Granted by administrator</p>
                        </div>
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Request
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {languages.length === 0 && pendingRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Code2 className="w-6 h-6 text-gray-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">No languages yet</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Request a language from your admin</p>
                                </div>
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Request Language
                                </button>
                            </div>
                        ) : languages.length === 0 ? (
                            // Has pending but no approved
                            <div className="space-y-2">
                                {pendingRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 bg-amber-50 ring-amber-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                                            <Hourglass className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-amber-700">{req.language_name}</p>
                                            <p className="text-[10px] text-amber-500">Waiting for approval</p>
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex-shrink-0">
                                            Pending
                                        </span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-primary/40 hover:text-primary transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Request another language
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {languages.map((lang) => {
                                    const { bg, text, ring } = getLangColor(lang.name);
                                    return (
                                        <div
                                            key={lang.id}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ${bg} ${ring}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                                                <span className={`text-xs font-bold ${text}`}>
                                                    {lang.display_name.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold ${text}`}>{lang.display_name}</p>
                                                <p className={`text-[10px] opacity-60 font-mono ${text}`}>
                                                    v{lang.version} · {lang.file_extension}
                                                </p>
                                            </div>
                                            <TrendingUp className={`w-3.5 h-3.5 opacity-30 flex-shrink-0 ${text}`} />
                                        </div>
                                    );
                                })}

                                {/* Pending requests */}
                                {pendingRequests
                                    .filter((r) => !languages.some(
                                        (l) => l.name.toLowerCase() === r.language_name.toLowerCase() ||
                                               l.display_name.toLowerCase() === r.language_name.toLowerCase()
                                    ))
                                    .map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 bg-amber-50 ring-amber-200"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                                                <Hourglass className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-amber-700">{req.language_name}</p>
                                                <p className="text-[10px] text-amber-500">Waiting for approval</p>
                                            </div>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex-shrink-0">
                                                Pending
                                            </span>
                                        </div>
                                    ))
                                }

                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-primary/40 hover:text-primary transition-colors mt-1"
                                >
                                    <Plus className="w-3 h-3" /> Request another language
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <DashboardQuickLinks
                items={[
                    { label: 'Courses',     href: '/faculty/courses',     icon: BookOpen,    gradientClass: 'from-blue-500 to-blue-600' },
                    { label: 'Assignments', href: '/faculty/assignments',  icon: FileText,    gradientClass: 'from-emerald-500 to-emerald-600' },
                    { label: 'Students',    href: '/faculty/students',     icon: GraduationCap, gradientClass: 'from-violet-500 to-violet-600' },
                    { label: 'Reports',     href: '/faculty/reports',      icon: TrendingUp,  gradientClass: 'from-amber-500 to-amber-600' },
                ]}
            />
        </div>
    );
}
