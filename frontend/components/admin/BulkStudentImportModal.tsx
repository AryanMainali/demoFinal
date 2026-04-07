'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { parseStudentsFromFile } from '@/lib/parse-students';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CourseLoadingSpinner } from '@/components/course/CourseLoading';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface BulkStudentImportResult {
    created: number;
    skipped: number;
}

export interface BulkStudentImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: BulkStudentImportResult) => void;
    onError?: (error: unknown) => void;
    /** Query keys to invalidate on success */
    invalidateKeys?: readonly (readonly unknown[])[];
}

interface StudentData {
    full_name?: string;
    email: string;
    student_id?: string;
}

function parseStudentTextData(text: string): StudentData[] {
    const lines = text.split('\n').filter(line => line.trim());
    const students: StudentData[] = [];

    for (const line of lines) {
        // Split by comma
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            const [fullName, email, studentId] = parts;
            if (fullName && email && studentId && email.includes('@')) {
                students.push({
                    full_name: fullName,
                    email: email.toLowerCase(),
                    student_id: studentId,
                });
            }
        }
    }

    return students;
}

export function BulkStudentImportModal({
    isOpen,
    onClose,
    onSuccess,
    onError,
    invalidateKeys = [],
}: BulkStudentImportModalProps) {
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkText, setBulkText] = useState('');
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isOpen) {
            setBulkFile(null);
            setBulkText('');
        }
    }, [isOpen]);

    const bulkImportMutation = useMutation({
        mutationFn: (students: Array<{ email: string; full_name?: string; student_id?: string }>) =>
            apiClient.bulkImportStudents(students),
        onSuccess: (data: BulkStudentImportResult) => {
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
            onSuccess?.(data);
            onClose();
            setBulkFile(null);
            setBulkText('');
        },
        onError: (err) => {
            onError?.(err);
        },
    });

    const handleBulkImport = async () => {
        let students: StudentData[] = [];

        if (bulkFile) {
            students = await parseStudentsFromFile(bulkFile);
        } else if (bulkText) {
            students = parseStudentTextData(bulkText);
        }

        if (students.length > 0) {
            bulkImportMutation.mutate(students);
        }
    };

    const handleDownloadExcelTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['full_name', 'email', 'student_id'],
            ['Ada Lovelace', 'ada.lovelace@example.edu', 'S001'],
            ['Alan Turing', 'alan.turing@example.edu', 'S002'],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'bulk-student-import-template.xlsx');
    };

    const handleDownloadCSVTemplate = () => {
        const csvContent = 'full_name,email,student_id\nAda Lovelace,ada.lovelace@example.edu,S001\nAlan Turing,alan.turing@example.edu,S002';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk-student-import-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const textStudentCount = parseStudentTextData(bulkText).length;
    const hasData = bulkFile !== null || bulkText.trim().length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setBulkFile(null);
                setBulkText('');
                onClose();
            }}
            title="Bulk Import Students"
            size="lg"
        >
            <div className="space-y-5">
                {/* Import context */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Import Type</p>
                    <p className="mt-0.5 font-semibold text-gray-900">Students Only</p>
                    <p className="text-sm text-gray-600 mt-2">
                        This import is for <strong>students only</strong>. Each row must include all required fields: full_name, email, and student_id.
                    </p>
                </div>

                {/* Template download */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDownloadExcelTemplate}
                        className="inline-flex items-center gap-2 text-sm text-[#862733] hover:underline font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Excel template
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadCSVTemplate}
                        className="inline-flex items-center gap-2 text-sm text-[#862733] hover:underline font-medium"
                    >
                        <Download className="w-4 h-4" />
                        CSV template
                    </button>
                </div>

                {/* File upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel or CSV file</label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            setBulkFile(f || null);
                            if (f) setBulkText('');
                        }}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                    {bulkFile && (
                        <span className="text-sm text-gray-600 mt-2 inline-block">
                            Selected: <strong>{bulkFile.name}</strong>
                        </span>
                    )}
                </div>

                {/* Manual entry */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or paste student data</label>
                    <textarea
                        rows={6}
                        placeholder={`Full Name,Email,Student ID\nAda Lovelace,ada.lovelace@example.edu,S001\nAlan Turing,alan.turing@example.edu,S002`}
                        value={bulkText}
                        onChange={(e) => {
                            setBulkText(e.target.value);
                            if (bulkFile) setBulkFile(null);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                        Separate columns by commas. One student per line. Format: Full Name, Email, Student ID
                    </p>
                </div>

                {/* Status indicator */}
                {!bulkFile ? (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                        {textStudentCount > 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <p className="text-sm font-medium text-gray-700">
                            {textStudentCount} valid student{textStudentCount !== 1 ? 's' : ''} detected
                        </p>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#862733]" />
                        <p className="text-sm font-medium text-gray-700">File ready: {bulkFile.name}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setBulkFile(null);
                            setBulkText('');
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBulkImport}
                        disabled={bulkImportMutation.isPending || !hasData}
                        className="bg-[#862733] hover:bg-[#a03040] text-white"
                    >
                        {bulkImportMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Importing..." />
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Import
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
