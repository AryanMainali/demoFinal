'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { format, isSameDay, parseISO, differenceInDays, differenceInHours, isPast } from 'date-fns';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
    CalendarDays,
    Clock,
    FileText,
    PanelRightClose,
    PanelRightOpen,
    X,
    BookOpen,
    GraduationCap,
    Target,
    Bell,
    Users,
    AlertCircle,
    CheckCircle,
    Plus,
    CheckSquare,
    Square,
    Minus,
    Trash2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
    id: number;
    title: string;
    date: string;
    event_type: string;
    course_code?: string;
    course_name?: string;
    course_id?: number;
    detail?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'todo' | 'in_progress' | 'done'; // personal tasks only
    task_key?: number; // personal task id
}

export interface RoleDashboardLayoutProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    eventsQuery: Pick<UseQueryOptions<CalendarEvent[]>, 'queryKey' | 'queryFn'> & { staleTime?: number };
    getEventHref: (event: CalendarEvent) => string;
    hideCalendarSidebar?: boolean;
}

// ── Personal Tasks ─────────────────────────────────────────────────────────

interface PersonalTask {
    id: number;
    title: string;
    date: string;
    status: 'todo' | 'in_progress' | 'done';
}

const STATUS_LABELS: Record<PersonalTask['status'], string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
};

const STATUS_COLORS: Record<PersonalTask['status'], string> = {
    todo:        'bg-gray-100 text-gray-500',
    in_progress: 'bg-amber-100 text-amber-700',
    done:        'bg-emerald-100 text-emerald-700',
};

const STATUS_ICONS: Record<PersonalTask['status'], React.ReactNode> = {
    todo:        <Square className="w-3 h-3" />,
    in_progress: <Minus className="w-3 h-3" />,
    done:        <CheckSquare className="w-3 h-3" />,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getTimeRemaining(dateStr: string): { text: string; urgent: boolean; overdue: boolean } {
    const date = parseISO(dateStr + (dateStr.includes('T') ? '' : 'T23:59:59'));
    const now = new Date();
    if (isPast(date)) {
        const d = Math.abs(differenceInDays(date, now));
        if (d === 0) return { text: 'Today', urgent: true, overdue: true };
        if (d === 1) return { text: '1d ago', urgent: false, overdue: true };
        return { text: `${d}d ago`, urgent: false, overdue: true };
    }
    const h = differenceInHours(date, now);
    const d = differenceInDays(date, now);
    if (h < 1) return { text: '< 1h', urgent: true, overdue: false };
    if (h < 24) return { text: `${h}h`, urgent: true, overdue: false };
    if (d === 1) return { text: '1 day', urgent: true, overdue: false };
    if (d <= 3) return { text: `${d}d`, urgent: true, overdue: false };
    if (d <= 7) return { text: `${d} days`, urgent: false, overdue: false };
    return { text: format(date, 'MMM d'), urgent: false, overdue: false };
}

const COURSE_COLORS = [
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { bg: 'bg-purple-50', text: 'text-purple-600' },
    { bg: 'bg-amber-50', text: 'text-amber-600' },
    { bg: 'bg-pink-50', text: 'text-pink-600' },
    { bg: 'bg-cyan-50', text: 'text-cyan-600' },
];

function getCourseColor(courseCode?: string) {
    if (!courseCode) return COURSE_COLORS[0];
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function eventStyle(event: CalendarEvent) {
    const past = isPast(parseISO(event.date + 'T23:59:59'));
    const t = event.event_type;
    const cc = getCourseColor(event.course_code);
    if (t === 'personal_task') return { bg: 'bg-violet-50 text-violet-600', Icon: CheckSquare };
    if (t === 'course_start') return { bg: 'bg-blue-50 text-blue-600', Icon: BookOpen };
    if (t === 'course_end')   return { bg: past ? 'bg-gray-100 text-gray-500' : 'bg-purple-50 text-purple-600', Icon: GraduationCap };
    if (t === 'exam')         return { bg: past ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600', Icon: AlertCircle };
    if (t === 'office_hours') return { bg: 'bg-green-50 text-green-600', Icon: Users };
    if (t === 'reminder' || t === 'announcement') return { bg: 'bg-yellow-50 text-yellow-600', Icon: Bell };
    if (t === 'grading')      return { bg: 'bg-orange-50 text-orange-600', Icon: Target };
    if (past)                 return { bg: 'bg-gray-100 text-gray-500', Icon: CheckCircle };
    if (t === 'deadline')     return { bg: `${cc.bg} ${cc.text}`, Icon: FileText };
    return { bg: 'bg-emerald-50 text-emerald-600', Icon: CheckCircle };
}

/** True for events that should not be navigable (course milestones, personal tasks, etc.) */
function isNonNavigable(event: CalendarEvent) {
    return event.event_type === 'course_start' || event.event_type === 'course_end' || event.event_type === 'personal_task';
}

// ── Add Task Modal ─────────────────────────────────────────────────────────

function AddTaskModal({
    defaultDate,
    onAdd,
    onClose,
}: {
    defaultDate: string;
    onAdd: (task: { title: string; date: string; status: string }) => void;
    onClose: () => void;
}) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(defaultDate);
    const [status, setStatus] = useState<PersonalTask['status']>('todo');
    const [addedDate, setAddedDate] = useState<string | null>(null);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isToday = date === todayStr;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !date) return;
        onAdd({ title: title.trim(), date, status });
        setAddedDate(date);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 z-10">
                {addedDate ? (
                    // ── Success state ──
                    <div className="flex flex-col items-center py-4 text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Task Added!</p>
                            {addedDate !== todayStr && (
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                    A reminder email will be sent on{' '}
                                    <span className="font-medium text-gray-700">
                                        {format(parseISO(addedDate), 'MMMM d, yyyy')}
                                    </span>{' '}
                                    reminding you about this task.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    // ── Form ──
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Add Task</h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">Personalize your schedule</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What do you need to do?"
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-300 transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as PersonalTask['status'])}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </div>
                            {!isToday && date && (
                                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                                    <Bell className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    Reminder email will be sent on {format(parseISO(date), 'MMM d, yyyy')}.
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                            >
                                Add Task
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Events List ────────────────────────────────────────────────────────────

function EventsList({
    events,
    selectedDate,
    getEventHref,
    personalTasks,
    onDeleteTask,
    onToggleTaskStatus,
    onAdd,
    defaultDate,
}: {
    events: CalendarEvent[];
    selectedDate: Date | null;
    getEventHref: (event: CalendarEvent) => string;
    personalTasks: PersonalTask[];
    onDeleteTask: (id: number) => void;
    onToggleTaskStatus: (id: number, currentStatus: string) => void;
    onAdd: (task: { title: string; date: string; status: string }) => void;
    defaultDate: string;
}) {
    const [showModal, setShowModal] = useState(false);

    // Merge personal tasks for the current view
    const todayStr = new Date().toISOString().slice(0, 10);
    const visibleTasks = selectedDate
        ? personalTasks.filter((t) => t.date === format(selectedDate, 'yyyy-MM-dd'))
        : personalTasks.filter((t) => t.date >= todayStr);

    const allItems: CalendarEvent[] = [
        ...events,
        ...visibleTasks.map((t): CalendarEvent => ({
            id: 0,
            title: t.title,
            date: t.date,
            event_type: 'personal_task',
            status: t.status,
            task_key: t.id,
        })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return (
        <>
            {showModal && (
                <AddTaskModal
                    defaultDate={defaultDate}
                    onAdd={onAdd}
                    onClose={() => setShowModal(false)}
                />
            )}
        <Card className="border-0 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3 flex-shrink-0">
                <CardTitle className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {selectedDate ? `Events · ${format(selectedDate, 'MMM d')}` : 'Upcoming'}
                    </span>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                        title="Add personal task"
                    >
                        <Plus className="w-3 h-3" /> Task
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 flex-1 overflow-y-auto">
                {allItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                        <p className="text-[11px] text-gray-400">
                            {selectedDate ? 'No events on this date' : 'No upcoming events'}
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add a task
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {allItems.map((event, idx) => {
                            const { bg, Icon } = eventStyle(event);
                            const timeInfo = getTimeRemaining(event.date);
                            const isTask = event.event_type === 'personal_task';
                            const isNonNav = isNonNavigable(event);

                            const inner = (
                                <div className={`flex items-start gap-2.5 p-2 rounded-lg ${!isNonNav ? 'hover:bg-gray-50 cursor-pointer' : ''} transition-colors`}>
                                    <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${bg}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium text-gray-900 truncate">{event.title}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {isTask ? (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status ?? 'todo']}`}>
                                                    {STATUS_LABELS[event.status ?? 'todo']}
                                                </span>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {event.course_code ? `${event.course_code} · ` : ''}{format(parseISO(event.date), 'MMM d')}
                                                    </p>
                                                    {!isNonNav && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                                            timeInfo.overdue
                                                                ? 'bg-gray-100 text-gray-500'
                                                                : timeInfo.urgent
                                                                    ? 'bg-red-100 text-red-700 animate-pulse'
                                                                    : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {timeInfo.text}
                                                        </span>
                                                    )}
                                                    {isNonNav && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                                                            {format(parseISO(event.date), 'MMM d')}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isTask && event.task_key && (
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleTaskStatus(event.task_key!, event.status ?? 'todo'); }}
                                                className="p-1 rounded text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Toggle status"
                                            >
                                                {STATUS_ICONS[event.status ?? 'todo']}
                                            </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteTask(event.task_key!); }}
                                                className="p-1 rounded text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );

                            if (!isNonNav) {
                                return (
                                    <Link key={`${event.id}-${event.event_type}-${idx}`} href={getEventHref(event)}>
                                        {inner}
                                    </Link>
                                );
                            }
                            return (
                                <div key={`${event.id}-${event.event_type}-${idx}`}>
                                    {inner}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
        </>
    );
}

// ── Main Layout ────────────────────────────────────────────────────────────

export default function RoleDashboardLayout({
    children,
    allowedRoles,
    eventsQuery,
    getEventHref,
    hideCalendarSidebar = false,
}: RoleDashboardLayoutProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: personalTasks = [] } = useQuery<PersonalTask[]>({
        queryKey: ['personal-tasks'],
        queryFn: () => apiClient.getTasks(),
        staleTime: 2 * 60_000,
        refetchOnWindowFocus: false,
    });

    const createMutation = useMutation({
        mutationFn: (data: { title: string; date: string; status: string }) =>
            apiClient.createTask(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { status?: string } }) =>
            apiClient.updateTask(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteTask(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
    });

    const addTask = useCallback((task: { title: string; date: string; status: string }) => {
        createMutation.mutate(task);
    }, [createMutation]);

    const deleteTask = useCallback((id: number) => {
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const toggleTaskStatus = useCallback((id: number, currentStatus: string) => {
        const cycle: PersonalTask['status'][] = ['todo', 'in_progress', 'done'];
        const idx = cycle.indexOf(currentStatus as PersonalTask['status']);
        const next = cycle[(idx + 1) % cycle.length];
        updateMutation.mutate({ id, data: { status: next } });
    }, [updateMutation]);

    const { data: events = [] } = useQuery<CalendarEvent[]>({
        ...eventsQuery,
        staleTime: eventsQuery.staleTime ?? 5 * 60_000,
        refetchOnWindowFocus: false,
    });

    const highlightDates = useMemo(() => events.map((e) => e.date), [events]);

    const calendarEvents = useMemo(
        () =>
            events.map((e) => ({
                date: e.date.slice(0, 10),
                event_type: e.event_type,
                course_code: e.course_code,
                course_id: e.course_id,
                title: e.title,
            })),
        [events],
    );

    const filteredEvents = useMemo(() => {
        if (selectedDate) {
            return events.filter((e) => {
                try { return isSameDay(parseISO(e.date), selectedDate); } catch { return false; }
            });
        }
        const todayStr = new Date().toISOString().slice(0, 10);
        return events.filter((e) => e.date >= todayStr).slice(0, 8);
    }, [events, selectedDate]);

    const defaultTaskDate = selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <DashboardLayout hideTopNav={hideCalendarSidebar}>
                <div className="flex gap-5 h-full min-h-0">
                    <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>

                    {!hideCalendarSidebar && !calendarOpen && (
                        <button
                            onClick={() => setCalendarOpen(true)}
                            className="hidden lg:flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-primary hover:border-primary/30 transition-colors self-start mt-1"
                            title="Show calendar"
                        >
                            <PanelRightOpen className="w-4 h-4" />
                        </button>
                    )}

                    {!hideCalendarSidebar && (
                        <aside className={`${calendarOpen ? 'w-72 xl:w-80' : 'w-0 overflow-hidden'} hidden lg:block flex-shrink-0 transition-all duration-300`}>
                            <div className="h-full space-y-3 flex flex-col">
                                <div className="flex justify-end flex-shrink-0">
                                    <button
                                        onClick={() => setCalendarOpen(false)}
                                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                        title="Hide calendar"
                                    >
                                        <PanelRightClose className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex-shrink-0">
                                    <DashboardCalendar
                                        highlightDates={highlightDates}
                                        events={calendarEvents}
                                        selectedDate={selectedDate}
                                        onSelectDate={setSelectedDate}
                                    />
                                </div>

                                <EventsList
                                    events={filteredEvents}
                                    selectedDate={selectedDate}
                                    getEventHref={getEventHref}
                                    personalTasks={personalTasks}
                                    onDeleteTask={deleteTask}
                                    onToggleTaskStatus={toggleTaskStatus}
                                    onAdd={addTask}
                                    defaultDate={defaultTaskDate}
                                />
                            </div>
                        </aside>
                    )}

                    {/* Mobile: floating calendar button */}
                    {!hideCalendarSidebar && (
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="fixed bottom-6 right-6 z-40 lg:hidden p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-700 transition-colors"
                            aria-label="Open calendar"
                        >
                            <CalendarDays className="w-5 h-5" />
                        </button>
                    )}

                    {/* Mobile: calendar drawer */}
                    {!hideCalendarSidebar && mobileDrawerOpen && (
                        <div className="lg:hidden fixed inset-0 z-50">
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-[min(320px,85vw)] bg-white shadow-2xl flex flex-col">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-primary" /> Calendar
                                    </h3>
                                    <button onClick={() => setMobileDrawerOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0">
                                    <DashboardCalendar
                                        highlightDates={highlightDates}
                                        events={calendarEvents}
                                        selectedDate={selectedDate}
                                        onSelectDate={setSelectedDate}
                                    />
                                    <EventsList
                                        events={filteredEvents}
                                        selectedDate={selectedDate}
                                        getEventHref={getEventHref}
                                        personalTasks={personalTasks}
                                        onDeleteTask={deleteTask}
                                        onToggleTaskStatus={toggleTaskStatus}
                                        onAdd={addTask}
                                        defaultDate={defaultTaskDate}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
