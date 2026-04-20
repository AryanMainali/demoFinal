'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    GUIDES, ROLE_META, getCategoriesForRole,
    type Guide, type GuideRole,
} from '@/lib/help/guides';
import {
    Search, BookOpen, FileCode, Target, Users, Upload, Award,
    Clock, Shield, BarChart2, CheckCircle2, MessageSquare,
    TrendingUp, UserPlus, ClipboardList, ChevronRight, Sparkles,
    GraduationCap, X,
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

const ALL_ROLES: GuideRole[] = ['FACULTY', 'STUDENT', 'ASSISTANT', 'ADMIN'];

export default function HelpPage() {
    const { user } = useAuth();
    const userRole = user?.role as GuideRole | undefined;

    const [search, setSearch] = useState('');
    const [activeRole, setActiveRole] = useState<GuideRole | 'ALL'>(userRole ?? 'ALL');

    const filteredGuides = useMemo(() => {
        let guides = activeRole === 'ALL' ? GUIDES : GUIDES.filter((g) => g.roles.includes(activeRole as GuideRole));
        if (search.trim()) {
            const q = search.toLowerCase();
            guides = guides.filter(
                (g) =>
                    g.title.toLowerCase().includes(q) ||
                    g.description.toLowerCase().includes(q) ||
                    g.category.toLowerCase().includes(q),
            );
        }
        return guides;
    }, [activeRole, search]);

    const categories = useMemo(() => {
        const cats = new Set(filteredGuides.map((g) => g.category));
        return Array.from(cats);
    }, [filteredGuides]);

    const guidesByCategory = useMemo(() => {
        const map = new Map<string, Guide[]>();
        for (const cat of categories) {
            map.set(cat, filteredGuides.filter((g) => g.category === cat));
        }
        return map;
    }, [filteredGuides, categories]);

    const totalGuides = filteredGuides.length;

    return (
        <div className="min-h-full bg-gray-50">
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#862733] via-[#9b2d3c] to-[#6e1f28]">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
                    <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Knowledge Base
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                        Knowledge Base Directory
                    </h1>
                    <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto mb-8">
                        Step-by-step guides to help you get the most out of Kriterion — for every role on the platform.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-lg mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search guides…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-400 shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-white/60 text-xs">
                        <span><span className="text-white font-semibold">{GUIDES.length}</span> guides</span>
                        <span className="w-px h-3 bg-white/20" />
                        <span><span className="text-white font-semibold">4</span> roles</span>
                        <span className="w-px h-3 bg-white/20" />
                        <span><span className="text-white font-semibold">~2–5 min</span> per guide</span>
                    </div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">

                {/* Role filter tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <RoleTab
                        role="ALL"
                        label="All Guides"
                        count={GUIDES.length}
                        active={activeRole === 'ALL'}
                        isCurrentUser={false}
                        onClick={() => setActiveRole('ALL')}
                    />
                    {ALL_ROLES.map((role) => (
                        <RoleTab
                            key={role}
                            role={role}
                            label={ROLE_META[role].label}
                            count={GUIDES.filter((g) => g.roles.includes(role)).length}
                            active={activeRole === role}
                            isCurrentUser={userRole === role}
                            onClick={() => setActiveRole(role)}
                        />
                    ))}
                </div>

                {/* Current role banner */}
                {userRole && activeRole === userRole && (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium border ${ROLE_META[userRole].bg} ${ROLE_META[userRole].border} ${ROLE_META[userRole].color}`}>
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        Showing guides for your role — <span className="font-semibold">{ROLE_META[userRole].label}</span>
                    </div>
                )}

                {/* Search results info */}
                {search && (
                    <p className="text-sm text-gray-500 mb-4">
                        {totalGuides === 0
                            ? `No guides found for "${search}"`
                            : `${totalGuides} guide${totalGuides !== 1 ? 's' : ''} matching "${search}"`}
                    </p>
                )}

                {/* Empty state */}
                {totalGuides === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No guides found</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different search term or select a different role.</p>
                        <button
                            onClick={() => { setSearch(''); setActiveRole('ALL'); }}
                            className="mt-4 text-sm text-[#862733] hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Guides by category */}
                <div className="space-y-10">
                    {categories.map((category) => {
                        const guides = guidesByCategory.get(category) ?? [];
                        return (
                            <section key={category}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-base font-semibold text-gray-800">{category}</h2>
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400">{guides.length} guide{guides.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {guides.map((guide) => (
                                        <GuideCard key={guide.slug} guide={guide} userRole={userRole} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Footer note */}
                {totalGuides > 0 && (
                    <div className="mt-12 text-center text-xs text-gray-400">
                        Can't find what you're looking for? Contact your system administrator.
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleTab({
    role, label, count, active, isCurrentUser, onClick,
}: {
    role: GuideRole | 'ALL';
    label: string;
    count: number;
    active: boolean;
    isCurrentUser: boolean;
    onClick: () => void;
}) {
    const meta = role !== 'ALL' ? ROLE_META[role] : null;

    return (
        <button
            onClick={onClick}
            className={`
                relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
                ${active
                    ? 'bg-[#862733] text-white border-[#862733] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#862733]/40 hover:text-[#862733]'
                }
            `}
        >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
            </span>
            {isCurrentUser && !active && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#862733] rounded-full border-2 border-white" />
            )}
            {isCurrentUser && active && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-[#862733]" />
            )}
        </button>
    );
}

function GuideCard({ guide, userRole }: { guide: Guide; userRole?: GuideRole }) {
    const isMyRole = userRole && guide.roles.includes(userRole);
    const primaryRole = guide.roles[0];
    const meta = ROLE_META[primaryRole];

    return (
        <Link
            href={`/help/${guide.slug}`}
            className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#862733]/20 transition-all duration-200 overflow-hidden"
        >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${isMyRole ? 'bg-[#862733]' : 'bg-gray-100 group-hover:bg-[#862733]/30 transition-colors'}`} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Icon + role badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMyRole ? 'bg-[#862733]/10' : 'bg-gray-100 group-hover:bg-[#862733]/10 transition-colors'}`}>
                        <GuideIcon
                            name={guide.iconName}
                            className={`w-5 h-5 ${isMyRole ? 'text-[#862733]' : 'text-gray-500 group-hover:text-[#862733] transition-colors'}`}
                        />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {meta.label}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-[#862733] transition-colors mb-1.5">
                        {guide.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {guide.description}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {guide.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>{guide.steps.length} steps</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#862733] group-hover:translate-x-0.5 transition-all" />
                </div>
            </div>
        </Link>
    );
}
