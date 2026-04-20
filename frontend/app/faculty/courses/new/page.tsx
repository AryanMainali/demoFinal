'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useMutationWithInvalidation } from '@/lib/use-mutation-with-invalidation';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Modal } from '@/components/ui/modal';
import { CourseLoadingPage, CourseLoadingSpinner } from '@/components/course/CourseLoading';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const SEMESTERS = ['Fall', 'Spring', 'Summer', 'Winter'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);

const PRESET_COLORS = [
    '#862733',
    '#1E40AF',
    '#065F46',
    '#7C2D12',
    '#581C87',
    '#0F766E',
    '#B45309',
    '#1D4ED8',
];

interface FormData {
    code: string;
    name: string;
    description: string;
    section: string;
    semester: string;
    year: number;
    start_date: string;
    end_date: string;
    color: string;
    status: 'draft' | 'active' | 'archived';
}

const toDateInput = (s: string | null | undefined): string => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const toLocalDateInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fromDateInput = (value: string): Date | null => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const today = () => new Date().toISOString().slice(0, 10);

const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

const initialForm: FormData = {
    code: '',
    name: '',
    description: '',
    section: '',
    semester: 'Spring',
    year: currentYear,
    start_date: '',
    end_date: '',
    color: '#862733',
    status: 'draft',
};

export default function NewCoursePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit') ? parseInt(searchParams.get('edit')!, 10) : null;
    const isEdit = Boolean(editId && !isNaN(editId));

    const { toast } = useToast();
    const [form, setForm] = useState<FormData>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formLoaded, setFormLoaded] = useState(!isEdit);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [hexInput, setHexInput] = useState('#862733');


    const todayDate = fromDateInput(today()) || new Date();
    const minStartDate = isEdit ? undefined : todayDate;
    const minEndDate = form.start_date
        ? fromDateInput(form.start_date) || (isEdit ? undefined : todayDate)
        : (isEdit ? undefined : todayDate);

    const { data: course } = useQuery({
        queryKey: ['course', editId],
        queryFn: () => apiClient.getCourse(editId!),
        enabled: isEdit && !!editId,
    });

    useEffect(() => {
        if (isEdit && course) {
            const color = course.color || '#862733';
            setForm({
                code: course.code,
                name: course.name,
                description: course.description || '',
                section: course.section || '',
                semester: course.semester,
                year: course.year,
                start_date: toDateInput(course.start_date),
                end_date: toDateInput(course.end_date),
                color,
                status: course.status || 'draft',
            });
            setHexInput(color);
            setFormLoaded(true);
        }
    }, [isEdit, course]);

    const buildPayload = (data: FormData): Record<string, unknown> => {
        const payload: Record<string, unknown> = {
            code: data.code.trim().toUpperCase(),
            name: data.name.trim(),
            description: data.description.trim() || undefined,
            section: data.section.trim() || undefined,
            semester: data.semester,
            year: data.year,
            color: data.color || undefined,
            status: data.status,
        };
        if (data.start_date) payload.start_date = new Date(data.start_date).toISOString();
        if (data.end_date) payload.end_date = new Date(data.end_date).toISOString();
        return payload;
    };

    const createMutation = useMutationWithInvalidation({
        mutationFn: (data: FormData) => apiClient.createCourse(buildPayload(data)),
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => setShowSuccessModal(true),
        onError: (err: any) => {
            const detail = err?.response?.data?.detail;
            if (typeof detail === 'string') {
                toast({ variant: 'destructive', title: 'Could not create course', description: detail });
            } else if (Array.isArray(detail)) {
                const fieldErrors: Record<string, string> = {};
                detail.forEach((d: any) => { fieldErrors[d?.loc?.[1] ?? 'submit'] = d?.msg ?? 'Invalid'; });
                setErrors(fieldErrors);
            } else {
                toast({ variant: 'destructive', title: 'Could not create course', description: err?.message ?? 'Something went wrong.' });
            }
        },
    });

    const updateMutation = useMutationWithInvalidation({
        mutationFn: (data: FormData) => {
            const payload = buildPayload(data);
            payload.is_active = data.status === 'active';
            if (!data.start_date) payload.start_date = null;
            if (!data.end_date) payload.end_date = null;
            payload.description = data.description.trim() || null;
            payload.section = data.section.trim() || null;
            payload.color = data.color || null;
            return apiClient.updateCourse(editId!, payload);
        },
        invalidateGroups: ['allCourses', 'allDashboards'],
        onSuccess: () => setShowSuccessModal(true),
        onError: (err: any) => {
            const detail = err?.response?.data?.detail;
            if (typeof detail === 'string') {
                toast({ variant: 'destructive', title: 'Could not save changes', description: detail });
            } else if (Array.isArray(detail)) {
                const fieldErrors: Record<string, string> = {};
                detail.forEach((d: any) => { fieldErrors[d?.loc?.[1] ?? 'submit'] = d?.msg ?? 'Invalid'; });
                setErrors(fieldErrors);
            } else {
                toast({ variant: 'destructive', title: 'Could not save changes', description: err?.message ?? 'Something went wrong.' });
            }
        },
    });

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.code.trim()) e.code = 'Course ID is required';
        if (!form.section.trim()) e.section = 'Section is required';
        if (!form.name.trim()) e.name = 'Course name is required';
        if (!form.semester) e.semester = 'Semester is required';
        if (!form.year || form.year < 2000 || form.year > 2100) e.year = 'Valid year is required';
        if (!form.start_date) e.start_date = 'Start date is required';
        if (!form.end_date) e.end_date = 'End date is required';
        if (form.color && !isValidHex(form.color)) e.color = 'Enter a valid hex color (e.g. #862733)';

        const todayStr = today();
        if (form.start_date && form.start_date < todayStr && !isEdit) {
            e.start_date = 'Start date must be today or later';
        }
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            e.end_date = 'End date must be on or after start date';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setErrors({});
        if (isEdit) {
            updateMutation.mutate(form);
        } else {
            createMutation.mutate(form);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const update = (key: keyof FormData, value: string | number | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: '' }));
        if (key === 'start_date' && form.end_date && typeof value === 'string' && value && value > form.end_date) {
            setForm((prev) => ({ ...prev, end_date: '' }));
        }
    };

    const applyColor = (c: string) => {
        update('color', c);
        setHexInput(c);
    };

    const handleHexInputChange = (val: string) => {
        setHexInput(val);
        if (isValidHex(val)) {
            update('color', val);
        }
    };

    const handleHexInputBlur = () => {
        if (!isValidHex(hexInput)) {
            setHexInput(form.color);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-12 px-4 sm:px-0">
            <div className="mb-6">
                <Link
                    href="/faculty/courses"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to courses
                </Link>
            </div>

            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? 'Edit Course' : 'New Course'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isEdit
                        ? 'Update course details below.'
                        : 'Draft courses are hidden from students until you publish.'}
                </p>
            </div>

            {isEdit && !formLoaded && (
                <CourseLoadingPage message="Loading course..." />
            )}

            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.push('/faculty/courses');
                }}
                size="sm"
            >
                <div className="flex flex-col items-center text-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isEdit ? 'Changes Saved' : 'Course Created'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEdit
                                ? `"${form.name}" has been updated successfully.`
                                : `"${form.name}" has been created as a draft.`}
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setShowSuccessModal(false);
                            router.push('/faculty/courses');
                        }}
                        className="w-full bg-[#862733] hover:bg-[#a03040]"
                    >
                        Go to Courses
                    </Button>
                </div>
            </Modal>

            {formLoaded && (
                <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">

                    {/* ── Identification ── */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Course Identification
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Course ID"
                                    placeholder="CSCI 2003"
                                    value={form.code}
                                    onChange={(e) => update('code', e.target.value.toUpperCase())}
                                    error={errors.code}
                                />
                                <Input
                                    label="Section"
                                    placeholder="A"
                                    value={form.section}
                                    onChange={(e) => update('section', e.target.value)}
                                    error={errors.section}
                                />
                            </div>

                            <Input
                                label="Course Name"
                                placeholder="Introduction to Java"
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                error={errors.name}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description
                                    <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    className="w-full min-h-[80px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent resize-y transition"
                                    placeholder="Brief overview of the course…"
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Schedule ── */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Schedule
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent transition"
                                        value={form.semester}
                                        onChange={(e) => update('semester', e.target.value)}
                                    >
                                        {SEMESTERS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent transition"
                                        value={form.year}
                                        onChange={(e) => update('year', parseInt(e.target.value))}
                                    >
                                        {YEARS.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Calendar
                                    label="Start Date"
                                    selectedDate={fromDateInput(form.start_date)}
                                    onDateChange={(date) => update('start_date', date ? toLocalDateInput(date) : '')}
                                    minDate={minStartDate}
                                    maxDate={form.end_date ? (fromDateInput(form.end_date) || undefined) : undefined}
                                    error={errors.start_date}
                                />
                                <Calendar
                                    label="End Date"
                                    selectedDate={fromDateInput(form.end_date)}
                                    onDateChange={(date) => update('end_date', date ? toLocalDateInput(date) : '')}
                                    minDate={minEndDate}
                                    error={errors.end_date}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Appearance ── */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Appearance
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Card Color
                                    <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                                </label>

                                {/* Preview */}
                                <div
                                    className="w-full h-10 rounded-lg mb-3 transition-colors duration-200"
                                    style={{ backgroundColor: isValidHex(form.color) ? form.color : '#862733' }}
                                />

                                {/* Swatches */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => applyColor(c)}
                                            title={c}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                form.color === c
                                                    ? 'border-gray-900 scale-110 ring-2 ring-gray-300'
                                                    : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>

                                {/* Hex input */}
                                <div className="relative max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">#</span>
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={hexInput.replace('#', '')}
                                        onChange={(e) => handleHexInputChange('#' + e.target.value)}
                                        onBlur={handleHexInputBlur}
                                        placeholder="862733"
                                        className={`w-full h-10 rounded-lg border pl-7 pr-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent transition ${
                                            errors.color ? 'border-red-400' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                {errors.color && (
                                    <p className="text-xs text-red-500 mt-1">{errors.color}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Visibility ── */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-5 sm:p-6 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Visibility
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {(['draft', 'active', 'archive'] as const).map((s) => {
                                    const label = s === 'active' ? 'Publish' : s.charAt(0).toUpperCase() + s.slice(1);
                                    const desc =
                                        s === 'draft'
                                            ? 'Only you can see it'
                                            : s === 'active'
                                            ? 'Visible to enrolled students'
                                            : 'Past course, read-only';
                                    return (
                                        <label
                                            key={s}
                                            className={`flex flex-col gap-0.5 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                                form.status === s
                                                    ? 'border-[#862733] bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    checked={form.status === s}
                                                    onChange={() => update('status', s)}
                                                    className="w-4 h-4 text-[#862733] border-gray-300 focus:ring-[#862733]"
                                                />
                                                <span className="text-sm font-medium text-gray-800">{label}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 pl-6">{desc}</p>
                                        </label>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Actions ── */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                        <Link href="/faculty/courses">
                            <Button type="button" variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isPending || (isEdit && !formLoaded)}
                            className="w-full sm:w-auto bg-[#862733] hover:bg-[#a03040] transition-all duration-200"
                        >
                            {isPending ? (
                                <CourseLoadingSpinner size="sm" label={isEdit ? 'Saving…' : 'Creating…'} />
                            ) : (
                                isEdit ? 'Save Changes' : 'Create Course'
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
