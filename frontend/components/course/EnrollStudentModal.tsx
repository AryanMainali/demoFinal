'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseLoadingSpinner } from '@/components/course/CourseLoading';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export interface EnrollStudentModalProps {
    courseId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: { enrolled?: boolean; student_not_found?: boolean; message?: string }) => void;
    onError?: (error: unknown) => void;
    courseInfo?: { code: string; name: string };
    invalidateKeys?: readonly (readonly unknown[])[];
    enrolledStudentIds?: number[];
}

export function EnrollStudentModal({
    courseId,
    isOpen,
    onClose,
    onSuccess,
    onError,
    courseInfo,
    invalidateKeys = [],
}: EnrollStudentModalProps) {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState<{ type: 'success' | 'warn' | null; message: string }>({ type: null, message: '' });
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setResult({ type: null, message: '' });
        }
    }, [isOpen]);

    const isFormValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    const enrollMutation = useMutation({
        mutationFn: () =>
            apiClient.enrollStudentByEmail(courseId, email.trim().toLowerCase()) as Promise<{
                enrolled?: boolean;
                student_not_found?: boolean;
                message?: string;
            }>,
        onSuccess: (data) => {
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
            if (data.student_not_found) {
                setResult({
                    type: 'warn',
                    message: data.message ?? 'Student not found. A request has been sent to the admin to add them.',
                });
            } else {
                setResult({
                    type: 'success',
                    message: data.message ?? `${email} has been enrolled in this course.`,
                });
                onSuccess?.(data);
                setTimeout(() => onClose(), 1800);
            }
        },
        onError: (err) => onError?.(err),
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enroll Student" size="sm">
            <div className="space-y-4">
                {courseInfo && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Course</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                            {courseInfo.code} – {courseInfo.name}
                        </p>
                    </div>
                )}

                <Input
                    label="Student Email"
                    type="email"
                    placeholder="student@warhawks.ulm.edu"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setResult({ type: null, message: '' });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && isFormValid) enrollMutation.mutate(); }}
                />

                {result.type === 'success' && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{result.message}</span>
                    </div>
                )}
                {result.type === 'warn' && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{result.message}</span>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => enrollMutation.mutate()}
                        disabled={!isFormValid || enrollMutation.isPending}
                        className="bg-[#862733] hover:bg-[#a03040] text-white"
                    >
                        {enrollMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Enrolling..." />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Enroll Student
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
