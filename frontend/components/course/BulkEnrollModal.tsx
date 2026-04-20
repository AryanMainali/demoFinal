'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { parseCanvasCSVFile, parseEmailsFromFile } from '@/lib/parse-emails';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CourseLoadingSpinner } from '@/components/course/CourseLoading';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Users,
    Mail,
    X,
    RefreshCw,
} from 'lucide-react';

export interface BulkEnrollResult {
    enrolled: number;
    failed?: number;
    not_found?: string[];
    already_enrolled?: string[];
}

export interface BulkEnrollModalProps {
    courseId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: BulkEnrollResult) => void;
    onError?: (error: unknown) => void;
    courseInfo?: { code: string; name: string };
    invalidateKeys?: readonly (readonly unknown[])[];
}

type Tab = 'canvas' | 'paste';

const CANVAS_COLUMNS = ['LastName', 'FirstName', 'ID', 'SIS User ID', 'SIS Login ID'];

export function BulkEnrollModal({
    courseId,
    isOpen,
    onClose,
    onSuccess,
    onError,
    courseInfo,
    invalidateKeys = [],
}: BulkEnrollModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('canvas');
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [parsedEmails, setParsedEmails] = useState<string[]>([]);
    const [missingLogins, setMissingLogins] = useState<string[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [pasteText, setPasteText] = useState('');
    const [rosterSentMsg, setRosterSentMsg] = useState<string | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isOpen) {
            setBulkFile(null);
            setParsedEmails([]);
            setMissingLogins([]);
            setParseError(null);
            setPasteText('');
            setActiveTab('canvas');
            setRosterSentMsg(null);
        }
    }, [isOpen]);

    const handleFileChange = async (file: File | null) => {
        setBulkFile(file);
        setParsedEmails([]);
        setMissingLogins([]);
        setParseError(null);
        if (!file) return;
        setIsParsing(true);
        try {
            const ext = file.name.toLowerCase().split('.').pop();
            if (ext === 'csv') {
                const result = await parseCanvasCSVFile(file);
                if (!result.isValidFormat) {
                    setParseError(result.invalidReason ?? 'Invalid CSV format.');
                } else if (result.emails.length === 0 && result.missing.length === 0) {
                    setParseError('The file has valid headers but contains no student rows.');
                } else {
                    setParsedEmails(result.emails);
                    setMissingLogins(result.missing);
                }
            } else {
                const emails = await parseEmailsFromFile(file);
                if (emails.length === 0) {
                    setParseError('No valid emails found in the uploaded file.');
                } else {
                    setParsedEmails(emails);
                }
            }
        } catch {
            setParseError('Failed to read the file. Please try again.');
        } finally {
            setIsParsing(false);
        }
    };

    const pasteEmails = pasteText
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'));

    const activeEmails = activeTab === 'canvas' ? parsedEmails : [...new Set(pasteEmails)];
    const hasEmails = activeEmails.length > 0;

    const bulkEnrollMutation = useMutation({
        mutationFn: (emails: string[]) => apiClient.bulkEnrollStudents(courseId, emails),
        onSuccess: (data: BulkEnrollResult) => {
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
            onSuccess?.(data);
            onClose();
        },
        onError: (err) => onError?.(err),
    });

    const handleEnroll = () => {
        if (!hasEmails) return;
        bulkEnrollMutation.mutate(activeEmails);
    };

    const rosterSyncMutation = useMutation({
        mutationFn: () => apiClient.requestRosterSync(courseId),
        onSuccess: () => {
            const courseName = courseInfo ? `${courseInfo.code} – ${courseInfo.name}` : 'this course';
            setRosterSentMsg(`Roster sync request sent to admin for ${courseName}.`);
        },
        onError: () => setRosterSentMsg('Failed to send request. Please try again.'),
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Enroll Students" size="lg">
            <div className="space-y-5">
                {courseInfo && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Course</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                            {courseInfo.code} – {courseInfo.name}
                        </p>
                    </div>
                )}

                {/* Tab switcher */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setActiveTab('canvas')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'canvas'
                            ? 'bg-[#862733] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Canvas CSV Export
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('paste')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${activeTab === 'paste'
                            ? 'bg-[#862733] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        Paste Emails
                    </button>
                </div>

                {/* Canvas CSV tab */}
                {activeTab === 'canvas' && (
                    <div className="space-y-4">
                        {/* Format instructions */}
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <p className="text-xs text-blue-700 mb-2 ml-6">
                                The file must have these column headers (in any order):
                            </p>
                            <div className="ml-6 flex flex-wrap gap-1.5">
                                {CANVAS_COLUMNS.map((col) => (
                                    <span
                                        key={col}
                                        className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium ${col === 'SIS Login ID'
                                            ? 'bg-blue-200 text-blue-900'
                                            : 'bg-white/70 text-blue-700 border border-blue-200'
                                            }`}
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`relative border-2 border-dashed rounded-xl transition-colors ${bulkFile && !parseError
                                ? 'border-[#862733]/40 bg-[#862733]/5'
                                : parseError
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                                }`}
                        >
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />
                            <div className="flex flex-col items-center justify-center gap-2 py-8 pointer-events-none">
                                <Upload
                                    className={`w-8 h-8 ${parseError ? 'text-red-400' : bulkFile ? 'text-[#862733]' : 'text-gray-400'
                                        }`}
                                />
                                {bulkFile ? (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-800">{bulkFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Click to replace</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-700">Drop your Canvas CSV here</p>
                                        <p className="text-xs text-gray-500 mt-0.5">or click to browse - .csv, .xlsx supported</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {bulkFile && (
                            <button
                                type="button"
                                onClick={() => handleFileChange(null)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600"
                            >
                                <X className="w-3.5 h-3.5" />
                                Remove file
                            </button>
                        )}

                        {/* Parse feedback */}
                        {isParsing && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <CourseLoadingSpinner size="sm" label="Parsing file..." />
                            </div>
                        )}

                        {!isParsing && parseError && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-800">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Invalid file format</p>
                                    <p className="text-xs text-red-600 mt-0.5">{parseError}</p>
                                </div>
                            </div>
                        )}

                        {!isParsing && !parseError && parsedEmails.length > 0 && (
                            <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-800">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    <span className="font-semibold">{parsedEmails.length}</span> student email
                                    {parsedEmails.length !== 1 ? 's' : ''} ready to enroll
                                </span>
                            </div>
                        )}

                        {!isParsing && !parseError && missingLogins.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium">
                                        {missingLogins.length} row{missingLogins.length !== 1 ? 's' : ''} missing SIS Login ID - will be skipped
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Paste emails tab */}
                {activeTab === 'paste' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Paste student emails
                            </label>
                            <textarea
                                rows={7}
                                placeholder={`student1@warhawks.ulm.edu\nstudent2@warhawks.ulm.edu`}
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#862733] focus:border-transparent font-mono text-sm resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                Separate by new lines, commas, or semicolons.
                            </p>
                        </div>
                        <div
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${pasteEmails.length > 0
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                                }`}
                        >
                            {pasteEmails.length > 0 ? (
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <Users className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span>
                                <span className="font-semibold">{pasteEmails.length}</span> valid email
                                {pasteEmails.length !== 1 ? 's' : ''} detected
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Students not found in the system will be flagged and admin will be notified.
                        </p>
                    </div>
                )}

                {/* Roster sync feedback */}
                {rosterSentMsg && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{rosterSentMsg}</span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    {/* Request Roster Sync button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs text-[#862733] border-[#862733]/30 hover:bg-[#862733]/5"
                        disabled={rosterSyncMutation.isPending}
                        onClick={() => {
                            setRosterSentMsg(null);
                            rosterSyncMutation.mutate();
                        }}
                    >
                        {rosterSyncMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Sending..." />
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                Request Admin Roster Sync
                            </>
                        )}
                    </Button>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEnroll}
                            disabled={bulkEnrollMutation.isPending || !hasEmails}
                            className="bg-[#862733] hover:bg-[#a03040] text-white"
                        >
                            {bulkEnrollMutation.isPending ? (
                                <CourseLoadingSpinner size="sm" label="Enrolling..." />
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Enroll{activeEmails.length > 0 ? ` ${activeEmails.length}` : ''} Student{activeEmails.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
