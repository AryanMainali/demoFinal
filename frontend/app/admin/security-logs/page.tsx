'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface SecurityLog {
    id: number;
    user_id?: number | null;
    event_type: string;
    description?: string | null;
    ip_address?: string | null;
    status: string;
    error_message?: string | null;
    created_at: string;
}

const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toStartOfDay = (dateString: string) => `${dateString}T00:00:00`;
const toEndOfDay = (dateString: string) => `${dateString}T23:59:59.999`;

const formatDateTime = (isoString: string) =>
    new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

export default function AdminSecurityLogsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [toDate, setToDate] = useState(formatDateForInput(new Date()));
    const [fromDate, setFromDate] = useState(
        formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    );
    const isDateRangeInvalid = fromDate > toDate;

    const { data: logs = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['admin-security-logs', fromDate, toDate],
        queryFn: () =>
            apiClient.getAuditLogs({
                limit: 500,
                from_date: toStartOfDay(fromDate),
                to_date: toEndOfDay(toDate),
            }) as Promise<SecurityLog[]>,
        enabled: !isDateRangeInvalid,
    });

    const filteredLogs = useMemo(() => {
        if (!searchQuery.trim()) return logs;
        const q = searchQuery.toLowerCase();
        return logs.filter((log) =>
            (log.event_type || '').toLowerCase().includes(q) ||
            (log.description || '').toLowerCase().includes(q) ||
            (log.error_message || '').toLowerCase().includes(q) ||
            (log.ip_address || '').toLowerCase().includes(q) ||
            String(log.user_id || '').includes(q)
        );
    }, [logs, searchQuery]);

    const failedCount = filteredLogs.filter((l) => l.status === 'failure').length;
    const successCount = filteredLogs.filter((l) => l.status === 'success').length;

    const columns = [
        {
            key: 'timestamp',
            header: 'Timestamp',
            cell: (log: SecurityLog) => (
                <span className="text-sm text-gray-700">{formatDateTime(log.created_at)}</span>
            ),
        },
        {
            key: 'event_type',
            header: 'Event',
            cell: (log: SecurityLog) => (
                <Badge variant="outline" className="font-mono text-xs">{log.event_type}</Badge>
            ),
        },
        {
            key: 'actor',
            header: 'Actor',
            cell: (log: SecurityLog) => (
                <span className="text-sm text-gray-700">{log.user_id ? `User #${log.user_id}` : 'Unknown'}</span>
            ),
        },
        {
            key: 'ip_address',
            header: 'IP Address',
            cell: (log: SecurityLog) => (
                <span className="text-sm font-mono text-gray-700">{log.ip_address || 'N/A'}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (log: SecurityLog) => (
                <Badge variant={log.status === 'failure' ? 'danger' : 'success'}>
                    {log.status}
                </Badge>
            ),
        },
        {
            key: 'details',
            header: 'Details',
            cell: (log: SecurityLog) => (
                <div className="max-w-[340px]">
                    <p className="text-sm text-gray-800 truncate">{log.description || '-'}</p>
                    {log.error_message && (
                        <p className="text-xs text-red-600 truncate">{log.error_message}</p>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#862733]" />
                        Security Logs
                    </h1>
                    <p className="text-gray-500 mt-1">Audit trail of authentication and security-critical system changes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{successCount} success</span>
                        <XCircle className="w-4 h-4 text-red-600 ml-3" />
                        <span>{failedCount} failure</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search by event, details, user ID, or IP"
                            />
                        </div>
                        <Input
                            type="date"
                            label="From Date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="To Date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                    {isDateRangeInvalid && (
                        <div className="mt-3 text-sm text-red-600">
                            From Date must be before or equal to To Date.
                        </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        Use Refresh after a new login attempt to fetch the latest audit entries.
                    </p>
                    {failedCount > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                            <AlertTriangle className="w-4 h-4" />
                            {failedCount} failure event(s) found in this filter window.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    isLoading={isLoading}
                    emptyMessage="No security events found for the selected filters"
                />
            </Card>
        </div>
    );
}
