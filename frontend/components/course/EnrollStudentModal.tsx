'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseLoadingSpinner } from '@/components/course/CourseLoading';
import { UserPlus, CheckCircle2, AlertCircle, Info } from 'lucide-react';

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

interface CanvasStudentFields {
    lastName: string;
    firstName: string;
    canvasId: string;
    sisUserId: string;
    sisLoginId: string;
}

const EMPTY_FIELDS: CanvasStudentFields = {
    lastName: '',
    firstName: '',
    canvasId: '',
    sisUserId: '',
    sisLoginId: '',
};

export function EnrollStudentModal({
    courseId,
    isOpen,
    onClose,
    onSuccess,
    onError,
    courseInfo,
    invalidateKeys = [],
}: EnrollStudentModalProps) {
    const [fields, setFields] = useState<CanvasStudentFields>(EMPTY_FIELDS);
    const [result, setResult] = useState<{ type: 'success' | 'warn' | null; message: string }>({ type: null, message: '' });
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isOpen) {
            setFields(EMPTY_FIELDS);
            setResult({ type: null, message: '' });
        }
    }, [isOpen]);

    const email = fields.sisLoginId.trim()
        ? `${fields.sisLoginId.trim().toLowerCase()}@warhawks.ulm.edu`
        : '';

    const isFormValid =
        fields.lastName.trim() &&
        fields.firstName.trim() &&
        fields.sisLoginId.trim();

    const enrollMutation = useMutation({
        mutationFn: () =>
            apiClient.enrollStudentByEmail(courseId, email, {
                first_name: fields.firstName.trim() || undefined,
                last_name: fields.lastName.trim() || undefined,
                canvas_user_id: fields.canvasId.trim() || undefined,
                cwid: fields.sisUserId.trim() || undefined,
            }) as Promise<{
                enrolled?: boolean;
                student_not_found?: boolean;
                message?: string;
            }>,
        onSuccess: (data) => {
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
            if (data.student_not_found) {
                // This only happens when no Canvas fields were provided (shouldn't occur from this modal)
                setResult({
                    type: 'warn',
                    message: `${fields.firstName} ${fields.lastName} was not found in the system. Admin has been notified.`,
                });
            } else {
                setResult({
                    type: 'success',
                    message: `${fields.firstName} ${fields.lastName} has been enrolled in this course.`,
                });
                onSuccess?.(data);
                setTimeout(() => onClose(), 1800);
            }
        },
        onError: (err) => onError?.(err),
    });

    const handleEnroll = () => {
        if (!isFormValid || !email) return;
        setResult({ type: null, message: '' });
        enrollMutation.mutate();
    };

    const field = (
        label: string,
        key: keyof CanvasStudentFields,
        placeholder: string,
        required = false,
        hint?: string,
    ) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <Input
                placeholder={placeholder}
                value={fields[key]}
                onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
            />
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enroll Student" size="md">
            <div className="space-y-4">
                {courseInfo && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Course</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                            {courseInfo.code} – {courseInfo.name}
                        </p>
                    </div>
                )}

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex gap-2 text-sm text-blue-700">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Enter the student information from Canvas. Fields match the Canvas People export format.</span>
                </div>

                {/* Canvas fields */}
                <div className="grid grid-cols-2 gap-3">
                    {field('Last Name', 'lastName', 'e.g. Smith', true)}
                    {field('First Name', 'firstName', 'e.g. John', true)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {field('Canvas User ID', 'canvasId', 'e.g. 12345')}
                    {field('SIS User ID (CWID)', 'sisUserId', 'e.g. 700123456')}
                </div>
                {field(
                    'SIS Login ID',
                    'sisLoginId',
                    'e.g. jsmith123',
                    true,
                    'This is the part before "@warhawks.ulm.edu" in their university email.',
                )}

                {/* Derived email preview */}
                {email && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500">Email:</span>
                        <span className="text-sm font-mono font-medium text-gray-800">{email}</span>
                    </div>
                )}

                {/* Result feedback */}
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
                        onClick={handleEnroll}
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
