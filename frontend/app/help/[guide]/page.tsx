'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getGuideBySlug, getGuidesByRole, GUIDES, ROLE_META,
    type Guide, type GuideRole,
} from '@/lib/help/guides';
import {
    ArrowLeft, Clock, CheckCircle2, ChevronRight, Lightbulb,
    BookOpen, FileCode, Target, Users, Upload, Award, Shield,
    BarChart2, MessageSquare, TrendingUp, UserPlus, ClipboardList,
    GraduationCap, Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    BookOpen, FileCode, Target, Users, Upload, Award, Clock,
    Shield, BarChart2, CheckCircle2, MessageSquare, TrendingUp,
    UserPlus, ClipboardList, GraduationCap,
};

function GuideIcon({ name, className }: { name: string; className?: string }) {
    const Icon = ICON_MAP[name] || BookOpen;
    return <Icon className={className} />;
}

export default function GuidePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const slug = Array.isArray(params?.guide) ? params.guide[0] : (params?.guide ?? '');

    const guide = getGuideBySlug(slug);
    const userRole = user?.role as GuideRole | undefined;

    if (!guide) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Guide not found</h2>
                <p className="text-sm text-gray-500 mb-6">This guide doesn't exist or may have been moved.</p>
                <Link
                    href="/help"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#862733] text-white text-sm font-medium rounded-lg hover:bg-[#9b2d3c] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
                </Link>
            </div>
        );
    }

    const primaryRole = guide.roles[0];
    const meta = ROLE_META[primaryRole];
    const isMyRole = userRole && guide.roles.includes(userRole);

    const relatedGuides = (guide.relatedSlugs ?? [])
        .map((s) => GUIDES.find((g) => g.slug === s))
        .filter(Boolean) as Guide[];

    // Other guides in the same category
    const sameCategory = GUIDES.filter(
        (g) => g.category === guide.category && g.slug !== guide.slug,
    ).slice(0, 3);

    return (
        <div className="min-h-full bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
                    <Link href="/help" className="hover:text-[#862733] transition-colors">Knowledge Base</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-500">{guide.category}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-700 font-medium truncate max-w-[200px]">{guide.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Header Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-[#862733] to-[#c0455a]" />
                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#862733]/10 flex items-center justify-center flex-shrink-0">
                                        <GuideIcon name={guide.iconName} className="w-7 h-7 text-[#862733]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {guide.roles.map((role) => (
                                                <span key={role} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_META[role].badge}`}>
                                                    {ROLE_META[role].label}
                                                </span>
                                            ))}
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {guide.category}
                                            </span>
                                        </div>
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{guide.title}</h1>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">{guide.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        ~{guide.estimatedTime} to complete
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {guide.steps.length} steps
                                    </span>
                                    {isMyRole && (
                                        <span className="flex items-center gap-1.5 text-[#862733]">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            For your role
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">Step-by-Step Guide</h2>
                            <ol className="space-y-0">
                                {guide.steps.map((step, index) => (
                                    <li key={index} className="flex gap-4 pb-6 last:pb-0 relative">
                                        {/* Connector line */}
                                        {index < guide.steps.length - 1 && (
                                            <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
                                        )}

                                        {/* Step number */}
                                        <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-[#862733] text-white text-sm font-bold flex items-center justify-center shadow-sm">
                                            {index + 1}
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 pt-2">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{step.detail}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Tips */}
                        {guide.tips && guide.tips.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="w-4 h-4 text-amber-600" />
                                    <h2 className="text-sm font-semibold text-amber-800">Pro Tips</h2>
                                </div>
                                <ul className="space-y-2">
                                    {guide.tips.map((tip, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-sm text-amber-800">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Back button */}
                        <Link
                            href="/help"
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#862733] transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Knowledge Base
                        </Link>

                        {/* Table of contents */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">In this guide</h3>
                            <ol className="space-y-2">
                                {guide.steps.map((step, index) => (
                                    <li key={index} className="flex items-start gap-2.5 text-xs text-gray-600">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#862733]/10 text-[#862733] text-[10px] font-bold flex items-center justify-center mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="leading-snug">{step.title}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Related guides */}
                        {relatedGuides.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Related Guides</h3>
                                <div className="space-y-2">
                                    {relatedGuides.map((related) => (
                                        <RelatedGuideLink key={related.slug} guide={related} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* More in category */}
                        {sameCategory.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">More in {guide.category}</h3>
                                <div className="space-y-2">
                                    {sameCategory.map((g) => (
                                        <RelatedGuideLink key={g.slug} guide={g} />
                                    ))}
                                </div>
                                <Link
                                    href="/help"
                                    className="mt-3 flex items-center gap-1 text-xs text-[#862733] hover:underline"
                                >
                                    View all guides <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Role info */}
                        <div className={`rounded-2xl border p-4 ${meta.bg} ${meta.border}`}>
                            <p className={`text-xs font-semibold mb-1 ${meta.color}`}>
                                {guide.roles.length === 1 ? `${meta.label} Guide` : 'Multi-Role Guide'}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                This guide applies to:{' '}
                                {guide.roles.map((r) => ROLE_META[r].label).join(', ')}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RelatedGuideLink({ guide }: { guide: Guide }) {
    const meta = ROLE_META[guide.roles[0]];
    return (
        <Link
            href={`/help/${guide.slug}`}
            className="flex items-center gap-2.5 group rounded-lg p-2 hover:bg-gray-50 transition-colors -mx-2"
        >
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#862733]/10 transition-colors">
                <GuideIcon name={guide.iconName} className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#862733] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 group-hover:text-[#862733] transition-colors truncate leading-snug">
                    {guide.title}
                </p>
                <p className="text-[10px] text-gray-400">{guide.estimatedTime}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-[#862733] transition-colors flex-shrink-0" />
        </Link>
    );
}
