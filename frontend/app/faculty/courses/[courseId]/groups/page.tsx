'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { AcknowledgementPopup } from '@/components/ui/acknowledgement-popup';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { CourseLoadingPage, CourseLoadingSpinner } from '@/components/course/CourseLoading';
import {
    UsersRound,
    Plus,
    Trash2,
    UserPlus,
    UserMinus,
    ChevronDown,
    ChevronUp,
    Crown,
    Search,
    Users,
    UserCheck,
    AlertCircle,
    Pencil,
    Wand2,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    ArrowRightLeft,
} from 'lucide-react';

interface GroupMember {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    student_id: string | null;
    is_leader: boolean;
}

interface Group {
    id: number;
    name: string;
    max_members: number;
    created_at: string;
    members: GroupMember[];
}

interface Student {
    id: number;
    full_name: string;
    email: string;
    student_id?: string | null;
    status: string;
}

interface SystemStudent {
    id: number;
    full_name: string;
    email: string;
    student_id?: string | null;
    is_active?: boolean;
    role?: string;
}

interface DraftMember {
    id: number;
    full_name: string;
    email: string;
    student_id?: string | null;
}

interface DraftGroup {
    draftId: string;
    name: string;
    members: DraftMember[];
}

function distributeStudents(
    students: DraftMember[],
    groupSize: number,
    startIndex: number,
): DraftGroup[] {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const n = shuffled.length;
    if (n === 0 || groupSize < 1) return [];
    const numGroups = Math.ceil(n / groupSize);
    const basePer = Math.floor(n / numGroups);
    const bigGroupCount = n % numGroups;

    const result: DraftGroup[] = [];
    let idx = 0;
    for (let g = 0; g < numGroups; g++) {
        const size = g < bigGroupCount ? basePer + 1 : basePer;
        result.push({
            draftId: `draft-${g}-${Math.random().toString(36).slice(2)}`,
            name: `Group ${startIndex + g + 1}`,
            members: shuffled.slice(idx, idx + size),
        });
        idx += size;
    }
    return result;
}

export default function CourseGroupsPage() {
    const params = useParams();
    const courseId = Number(params?.courseId);
    const queryClient = useQueryClient();

    // Create group modal
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMaxMembers, setNewGroupMaxMembers] = useState(4);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Group list
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    // Add member
    const [addMemberModal, setAddMemberModal] = useState<Group | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    // Delete group
    const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

    // Edit group
    const [editTarget, setEditTarget] = useState<Group | null>(null);
    const [editName, setEditName] = useState('');
    const [editMaxMembers, setEditMaxMembers] = useState(4);

    // Auto-assign
    const [autoAssignOpen, setAutoAssignOpen] = useState(false);
    const [autoAssignSize, setAutoAssignSize] = useState(4);
    const [autoAssignStep, setAutoAssignStep] = useState<'config' | 'preview'>('config');
    const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
    const [movingStudentKey, setMovingStudentKey] = useState<{ studentId: number; fromGroupId: string } | null>(null);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [editingDraftName, setEditingDraftName] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    // Notifications
    const [notification, setNotification] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
    }>({ open: false, type: 'success', title: '', message: '' });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ open: true, type, title: type === 'success' ? 'Success' : 'Error', message });
    };

    // Queries
    const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
        queryKey: ['course-groups', courseId],
        queryFn: () => apiClient.getCourseGroups(courseId),
        enabled: !!courseId,
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
        queryKey: ['course-students', courseId],
        queryFn: async () => {
            const data = await apiClient.getCourseStudents(courseId);
            return (Array.isArray(data) ? data : []) as Student[];
        },
        enabled: !!courseId,
    });

    const { data: systemStudents = [], isLoading: systemStudentsLoading } = useQuery<SystemStudent[]>({
        queryKey: ['system-students'],
        queryFn: () => apiClient.getFacultyStudents() as Promise<SystemStudent[]>,
        enabled: !!addMemberModal,
        staleTime: 60_000,
    });

    const { data: course } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => apiClient.getCourse(courseId) as Promise<{ color?: string | null }>,
        enabled: !!courseId,
    });
    const accentColor = course?.color || '#862733';

    // Derived data
    const activeStudents = useMemo(() => students.filter((s) => s.status === 'active'), [students]);

    const assignedUserIds = useMemo(
        () => new Set(groups.flatMap((g) => g.members.map((m) => m.user_id))),
        [groups],
    );

    const unassignedStudents = useMemo(
        () => activeStudents.filter((s) => !assignedUserIds.has(s.id)),
        [activeStudents, assignedUserIds],
    );

    const filteredAvailableStudents = useMemo(() => {
        if (!addMemberModal) return [];
        const inGroup = new Set(addMemberModal.members.map((m) => m.user_id));
        const candidates = systemStudents.filter(
            (s) => s.is_active !== false && !assignedUserIds.has(s.id) && !inGroup.has(s.id),
        );
        const q = memberSearch.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter(
            (s) =>
                s.full_name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                (s.student_id ?? '').toLowerCase().includes(q),
        );
    }, [addMemberModal, systemStudents, assignedUserIds, memberSearch]);

    // Auto-assign distribution preview
    const previewDistribution = useMemo(() => {
        const n = unassignedStudents.length;
        if (n === 0 || autoAssignSize < 1) return null;
        const numGroups = Math.ceil(n / autoAssignSize);
        const basePer = Math.floor(n / numGroups);
        const bigGroupCount = n % numGroups;
        const smallGroupCount = numGroups - bigGroupCount;

        if (bigGroupCount === 0) {
            return `${n} student${n !== 1 ? 's' : ''} → ${numGroups} group${numGroups !== 1 ? 's' : ''} of ${basePer}`;
        }
        if (smallGroupCount === 0) {
            return `${n} student${n !== 1 ? 's' : ''} → ${numGroups} group${numGroups !== 1 ? 's' : ''} of ${basePer + 1}`;
        }
        return (
            `${n} student${n !== 1 ? 's' : ''} → ` +
            `${bigGroupCount} group${bigGroupCount !== 1 ? 's' : ''} of ${basePer + 1} ` +
            `+ ${smallGroupCount} group${smallGroupCount !== 1 ? 's' : ''} of ${basePer}`
        );
    }, [unassignedStudents.length, autoAssignSize]);

    // Mutations
    const createGroupMutation = useMutation({
        mutationFn: () =>
            apiClient.createCourseGroup(courseId, { name: newGroupName.trim(), max_members: newGroupMaxMembers }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setNewGroupName('');
            setNewGroupMaxMembers(4);
            setCreateModalOpen(false);
            showNotification('success', 'Group created successfully.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to create group.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to create group.');
        },
    });

    const deleteGroupMutation = useMutation({
        mutationFn: (groupId: number) => apiClient.deleteCourseGroup(courseId, groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setDeleteTarget(null);
            showNotification('success', 'Group deleted.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to delete group.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to delete group.');
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
            apiClient.addGroupMember(courseId, groupId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setAddMemberModal(null);
            setMemberSearch('');
            setSelectedStudentId(null);
            showNotification('success', 'Student added to group.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to add student.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to add student.');
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
            apiClient.removeGroupMember(courseId, groupId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            showNotification('success', 'Student removed from group.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to remove student.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to remove student.');
        },
    });

    const updateGroupMutation = useMutation({
        mutationFn: ({ groupId, data }: { groupId: number; data: { name?: string; max_members?: number } }) =>
            apiClient.updateCourseGroup(courseId, groupId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setEditTarget(null);
            showNotification('success', 'Group updated.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to update group.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to update group.');
        },
    });

    // Auto-assign helpers
    const resetAutoAssign = () => {
        setAutoAssignStep('config');
        setDraftGroups([]);
        setMovingStudentKey(null);
        setEditingDraftId(null);
        setEditingDraftName('');
    };

    const handleGeneratePreview = () => {
        const drafts = distributeStudents(
            unassignedStudents.map((s) => ({
                id: s.id,
                full_name: s.full_name,
                email: s.email,
                student_id: s.student_id,
            })),
            autoAssignSize,
            groups.length,
        );
        setDraftGroups(drafts);
        setMovingStudentKey(null);
        setEditingDraftId(null);
        setAutoAssignStep('preview');
    };

    const handleReshuffle = () => {
        const allMembers = draftGroups.flatMap((g) => g.members);
        const drafts = distributeStudents(allMembers, autoAssignSize, groups.length);
        setDraftGroups(drafts);
        setMovingStudentKey(null);
        setEditingDraftId(null);
    };

    const moveStudent = (studentId: number, fromGroupId: string, toGroupId: string) => {
        setDraftGroups((prev) => {
            const fromGroup = prev.find((g) => g.draftId === fromGroupId);
            const student = fromGroup?.members.find((m) => m.id === studentId);
            if (!student) return prev;
            return prev.map((g) => {
                if (g.draftId === fromGroupId) {
                    return { ...g, members: g.members.filter((m) => m.id !== studentId) };
                }
                if (g.draftId === toGroupId) {
                    return { ...g, members: [...g.members, student] };
                }
                return g;
            });
        });
    };

    const renameDraftGroup = (draftId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        setDraftGroups((prev) =>
            prev.map((g) => (g.draftId === draftId ? { ...g, name: trimmed } : g)),
        );
    };

    const handleConfirmAutoAssign = async () => {
        setIsConfirming(true);
        try {
            const totalStudents = draftGroups.reduce((s, g) => s + g.members.length, 0);
            for (const dg of draftGroups) {
                const group = await apiClient.createCourseGroup(courseId, {
                    name: dg.name.trim() || 'Group',
                    max_members: dg.members.length,
                }) as { id: number };
                for (const member of dg.members) {
                    await apiClient.addGroupMember(courseId, group.id, member.id);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setAutoAssignOpen(false);
            resetAutoAssign();
            showNotification(
                'success',
                `Created ${draftGroups.length} group${draftGroups.length !== 1 ? 's' : ''} and assigned ${totalStudents} student${totalStudents !== 1 ? 's' : ''}.`,
            );
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
                'Failed to create groups. Some groups may have been partially created.';
            showNotification('error', typeof msg === 'string' ? msg : 'Failed to create groups.');
        } finally {
            setIsConfirming(false);
        }
    };

    // Group list helpers
    const toggleGroup = (groupId: number) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const openAddMember = (group: Group) => {
        setAddMemberModal(group);
        setMemberSearch('');
        setSelectedStudentId(null);
    };

    if (groupsLoading || studentsLoading) {
        return <CourseLoadingPage message="Loading groups..." />;
    }

    return (
        <>
            <div className="space-y-6 pb-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <UsersRound className="w-5 h-5" style={{ color: accentColor }} />
                            Student Groups
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Each student can only belong to one group.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {unassignedStudents.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => { setAutoAssignOpen(true); resetAutoAssign(); }}
                                className="gap-2 text-gray-700 border-gray-300 hover:border-gray-400"
                            >
                                <Wand2 className="w-4 h-4" /> Auto-Assign
                            </Button>
                        )}
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="gap-2 text-white"
                            style={{ backgroundColor: accentColor }}
                        >
                            <Plus className="w-4 h-4" /> New Group
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${accentColor}18` }}
                                >
                                    <UsersRound className="w-5 h-5" style={{ color: accentColor }} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                                    <p className="text-xs text-gray-500">Groups</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-600">{assignedUserIds.size}</p>
                                    <p className="text-xs text-gray-500">Assigned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md col-span-2 sm:col-span-1">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-600">{unassignedStudents.length}</p>
                                    <p className="text-xs text-gray-500">Unassigned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Groups list */}
                {groups.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                        <UsersRound className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-600">No groups yet</p>
                        <p className="text-sm text-gray-400 mt-1 mb-5">Create your first group or use Auto-Assign.</p>
                        <div className="flex items-center justify-center gap-2">
                            {unassignedStudents.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => { setAutoAssignOpen(true); resetAutoAssign(); }}
                                    className="gap-2"
                                >
                                    <Wand2 className="w-4 h-4" /> Auto-Assign
                                </Button>
                            )}
                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                className="gap-2 text-white"
                                style={{ backgroundColor: accentColor }}
                            >
                                <Plus className="w-4 h-4" /> Create First Group
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {groups.map((group) => {
                            const expanded = expandedGroups.has(group.id);
                            const isFull = group.members.length >= group.max_members;
                            const fillPct = Math.round((group.members.length / group.max_members) * 100);

                            return (
                                <Card key={group.id} className="border-gray-200 shadow-sm overflow-hidden">
                                    <div
                                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${accentColor}15` }}
                                            >
                                                <UsersRound className="w-5 h-5" style={{ color: accentColor }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${fillPct}%`,
                                                                backgroundColor: isFull ? '#16a34a' : accentColor,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {group.members.length}/{group.max_members}
                                                        {isFull && (
                                                            <span className="ml-1.5 text-emerald-600 font-medium">
                                                                Full
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditTarget(group);
                                                    setEditName(group.name);
                                                    setEditMaxMembers(group.max_members);
                                                }}
                                                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                                title="Edit group"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(group);
                                                }}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete group"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {expanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {expanded && (
                                        <div className="border-t border-gray-100 bg-gray-50/50">
                                            {group.members.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-gray-400">
                                                    No members yet.
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-gray-100">
                                                    {group.members.map((member) => (
                                                        <li
                                                            key={member.id}
                                                            className="flex items-center justify-between px-5 py-3"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                    style={{
                                                                        backgroundColor: `${accentColor}18`,
                                                                        color: accentColor,
                                                                    }}
                                                                >
                                                                    {member.full_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 truncate">
                                                                        {member.full_name}
                                                                        {member.is_leader && (
                                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                                                <Crown className="w-2.5 h-2.5" />{' '}
                                                                                Leader
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {member.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeMemberMutation.mutate({
                                                                        groupId: group.id,
                                                                        userId: member.user_id,
                                                                    })
                                                                }
                                                                disabled={removeMemberMutation.isPending}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                                                title="Remove from group"
                                                            >
                                                                <UserMinus className="w-4 h-4" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <div className="px-5 py-3 border-t border-gray-100">
                                                {isFull ? (
                                                    <p className="text-xs text-amber-600 flex items-center gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Group is at maximum capacity ({group.max_members} members).
                                                    </p>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAddMember(group)}
                                                        className="flex items-center gap-1.5 text-sm font-medium hover:underline"
                                                        style={{ color: accentColor }}
                                                    >
                                                        <UserPlus className="w-4 h-4" /> Add student
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Unassigned students callout */}
                {unassignedStudents.length > 0 && groups.length > 0 && (
                    <Card className="border border-amber-200 bg-amber-50/50 shadow-none">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-800">
                                    {unassignedStudents.length} student
                                    {unassignedStudents.length !== 1 ? 's' : ''} not assigned to any group
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5 truncate">
                                    {unassignedStudents.map((s) => s.full_name).join(', ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setAutoAssignOpen(true); resetAutoAssign(); }}
                                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
                            >
                                <Wand2 className="w-3.5 h-3.5" /> Auto-assign
                            </button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Group Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New Group"
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
                        <Input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g., Team Alpha"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newGroupName.trim()) createGroupMutation.mutate();
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Members</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={newGroupMaxMembers}
                            onChange={(e) =>
                                setNewGroupMaxMembers(Math.max(1, parseInt(e.target.value, 10) || 1))
                            }
                            className="w-full h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                        />
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (!newGroupName.trim()) {
                                showNotification('error', 'Group name is required.');
                                return;
                            }
                            createGroupMutation.mutate();
                        }}
                        disabled={createGroupMutation.isPending || !newGroupName.trim()}
                        className="text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        {createGroupMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Creating..." />
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-1.5" /> Create Group
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Group Modal */}
            <Modal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                title="Edit Group"
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Group name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && editTarget && editName.trim()) {
                                    updateGroupMutation.mutate({
                                        groupId: editTarget.id,
                                        data: { name: editName.trim(), max_members: editMaxMembers },
                                    });
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Members</label>
                        <input
                            type="number"
                            min={editTarget?.members.length ?? 1}
                            max={50}
                            value={editMaxMembers}
                            onChange={(e) =>
                                setEditMaxMembers(
                                    Math.max(editTarget?.members.length ?? 1, parseInt(e.target.value, 10) || 1),
                                )
                            }
                            className="w-full h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                        />
                        {editTarget && editTarget.members.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                Minimum {editTarget.members.length} (current member count)
                            </p>
                        )}
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setEditTarget(null)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (!editTarget || !editName.trim()) return;
                            updateGroupMutation.mutate({
                                groupId: editTarget.id,
                                data: { name: editName.trim(), max_members: editMaxMembers },
                            });
                        }}
                        disabled={updateGroupMutation.isPending || !editName.trim()}
                        className="text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        {updateGroupMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Saving..." />
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                isOpen={!!addMemberModal}
                onClose={() => {
                    setAddMemberModal(null);
                    setMemberSearch('');
                    setSelectedStudentId(null);
                }}
                title={`Add Student to ${addMemberModal?.name ?? ''}`}
                size="sm"
            >
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or ID..."
                            value={memberSearch}
                            onChange={(e) => {
                                setMemberSearch(e.target.value);
                                setSelectedStudentId(null);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {systemStudentsLoading ? (
                            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                                <CourseLoadingSpinner size="sm" label="Loading students..." />
                            </div>
                        ) : filteredAvailableStudents.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">
                                {memberSearch.trim()
                                    ? 'No students match your search.'
                                    : 'All active students are already in groups.'}
                            </div>
                        ) : (
                            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                                {filteredAvailableStudents.map((s) => {
                                    const selected = selectedStudentId === s.id;
                                    return (
                                        <li key={s.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedStudentId(selected ? null : s.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                    selected ? 'border-l-2' : 'hover:bg-gray-50'
                                                }`}
                                                style={
                                                    selected
                                                        ? {
                                                              borderLeftColor: accentColor,
                                                              backgroundColor: `${accentColor}08`,
                                                          }
                                                        : {}
                                                }
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={
                                                        selected
                                                            ? { backgroundColor: accentColor, color: 'white' }
                                                            : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                                                    }
                                                >
                                                    {s.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {s.full_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                                </div>
                                                {s.student_id && (
                                                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                                                        {s.student_id}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
                <ModalFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAddMemberModal(null);
                            setMemberSearch('');
                            setSelectedStudentId(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (!addMemberModal || !selectedStudentId) return;
                            addMemberMutation.mutate({ groupId: addMemberModal.id, userId: selectedStudentId });
                        }}
                        disabled={!selectedStudentId || addMemberMutation.isPending}
                        className="text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        {addMemberMutation.isPending ? (
                            <CourseLoadingSpinner size="sm" label="Adding..." />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-1.5" /> Add to Group
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Auto-Assign Modal */}
            <Modal
                isOpen={autoAssignOpen}
                onClose={() => {
                    if (!isConfirming) {
                        setAutoAssignOpen(false);
                        resetAutoAssign();
                    }
                }}
                title={autoAssignStep === 'config' ? 'Auto-Assign Groups' : 'Preview & Edit Groups'}
                size={autoAssignStep === 'preview' ? 'lg' : 'sm'}
            >
                {autoAssignStep === 'config' ? (
                    /* ── Step 1: Configure ── */
                    <div className="space-y-5">
                        <p className="text-sm text-gray-500">
                            Randomly distribute{' '}
                            <span className="font-medium text-gray-700">{unassignedStudents.length}</span> unassigned
                            student{unassignedStudents.length !== 1 ? 's' : ''} into equal-sized groups.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Students per group
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAutoAssignSize((s) => Math.max(1, s - 1))}
                                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium transition-colors select-none"
                                    disabled={autoAssignSize <= 1}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, unassignedStudents.length)}
                                    value={autoAssignSize}
                                    onChange={(e) =>
                                        setAutoAssignSize(Math.max(1, parseInt(e.target.value, 10) || 1))
                                    }
                                    className="w-20 h-9 rounded-lg border border-gray-300 px-3 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:border-transparent"
                                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                                />
                                <button
                                    type="button"
                                    onClick={() => setAutoAssignSize((s) => s + 1)}
                                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium transition-colors select-none"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {unassignedStudents.length === 0 ? (
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                <p className="text-sm text-amber-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    All enrolled students are already assigned to groups.
                                </p>
                            </div>
                        ) : previewDistribution ? (
                            <div
                                className="p-3.5 rounded-xl border"
                                style={{
                                    backgroundColor: `${accentColor}08`,
                                    borderColor: `${accentColor}25`,
                                }}
                            >
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Distribution preview
                                </p>
                                <p className="text-sm font-medium text-gray-800">{previewDistribution}</p>
                                {unassignedStudents.length % autoAssignSize !== 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Groups may differ by 1 student for even distribution.
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    /* ── Step 2: Preview & Edit ── */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-700">{draftGroups.length}</span> groups ·{' '}
                                <span className="font-medium text-gray-700">
                                    {draftGroups.reduce((s, g) => s + g.members.length, 0)}
                                </span>{' '}
                                students assigned
                            </p>
                            <button
                                type="button"
                                onClick={handleReshuffle}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Re-shuffle
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 -mt-2">
                            Click a group name to rename · Use{' '}
                            <ArrowRightLeft className="w-3 h-3 inline" /> to move students between groups
                        </p>

                        <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-0.5">
                            {draftGroups.map((dg) => (
                                <div key={dg.draftId} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Group header */}
                                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
                                        {editingDraftId === dg.draftId ? (
                                            <input
                                                autoFocus
                                                value={editingDraftName}
                                                onChange={(e) => setEditingDraftName(e.target.value)}
                                                onBlur={() => {
                                                    renameDraftGroup(dg.draftId, editingDraftName);
                                                    setEditingDraftId(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        renameDraftGroup(dg.draftId, editingDraftName);
                                                        setEditingDraftId(null);
                                                    }
                                                    if (e.key === 'Escape') setEditingDraftId(null);
                                                }}
                                                className="flex-1 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 mr-2"
                                                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingDraftId(dg.draftId);
                                                    setEditingDraftName(dg.name);
                                                }}
                                                className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600 group transition-colors"
                                                title="Click to rename"
                                            >
                                                {dg.name}
                                                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                            </button>
                                        )}
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: `${accentColor}15`,
                                                color: accentColor,
                                            }}
                                        >
                                            {dg.members.length} member{dg.members.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Members */}
                                    {dg.members.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-gray-400">
                                            No members — move students here
                                        </div>
                                    ) : (
                                        <ul>
                                            {dg.members.map((member) => {
                                                const isMoving =
                                                    movingStudentKey?.studentId === member.id &&
                                                    movingStudentKey.fromGroupId === dg.draftId;
                                                const otherGroups = draftGroups.filter(
                                                    (og) => og.draftId !== dg.draftId,
                                                );
                                                return (
                                                    <React.Fragment key={member.id}>
                                                        <li className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 first:border-t-0">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                    style={{
                                                                        backgroundColor: `${accentColor}18`,
                                                                        color: accentColor,
                                                                    }}
                                                                >
                                                                    {member.full_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {member.full_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        {member.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {otherGroups.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    title="Move to another group"
                                                                    onClick={() =>
                                                                        setMovingStudentKey(
                                                                            isMoving
                                                                                ? null
                                                                                : {
                                                                                      studentId: member.id,
                                                                                      fromGroupId: dg.draftId,
                                                                                  },
                                                                        )
                                                                    }
                                                                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                                                        isMoving
                                                                            ? 'text-gray-700 bg-gray-100'
                                                                            : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </li>

                                                        {/* Move target panel */}
                                                        {isMoving && (
                                                            <li className="px-3.5 py-2.5 bg-indigo-50/60 border-t border-indigo-100">
                                                                <p className="text-xs font-medium text-gray-500 mb-2">
                                                                    Move{' '}
                                                                    <span className="text-gray-700">
                                                                        {member.full_name.split(' ')[0]}
                                                                    </span>{' '}
                                                                    to:
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {otherGroups.map((og) => (
                                                                        <button
                                                                            key={og.draftId}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                moveStudent(
                                                                                    member.id,
                                                                                    dg.draftId,
                                                                                    og.draftId,
                                                                                );
                                                                                setMovingStudentKey(null);
                                                                            }}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
                                                                        >
                                                                            <ArrowRight className="w-3 h-3 text-gray-400" />
                                                                            {og.name}
                                                                            <span className="text-gray-400">
                                                                                ({og.members.length})
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </li>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ModalFooter>
                    {autoAssignStep === 'config' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAutoAssignOpen(false);
                                    resetAutoAssign();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGeneratePreview}
                                disabled={unassignedStudents.length === 0}
                                className="gap-2 text-white"
                                style={{ backgroundColor: accentColor }}
                            >
                                Preview <ArrowRight className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAutoAssignStep('config');
                                    setMovingStudentKey(null);
                                    setEditingDraftId(null);
                                }}
                                disabled={isConfirming}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                            </Button>
                            <Button
                                onClick={handleConfirmAutoAssign}
                                disabled={isConfirming || draftGroups.length === 0}
                                className="gap-2 text-white"
                                style={{ backgroundColor: accentColor }}
                            >
                                {isConfirming ? (
                                    <CourseLoadingSpinner size="sm" label="Creating groups..." />
                                ) : (
                                    <>
                                        Confirm & Create {draftGroups.length} Group
                                        {draftGroups.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </Modal>

            {/* Delete Group Confirmation */}
            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteGroupMutation.mutate(deleteTarget.id)}
                confirmationPhrase="Delete"
                itemName={deleteTarget?.name}
                title="Delete Group?"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete "${deleteTarget.name}"? All members will be removed. Type "Delete" to confirm.`
                        : undefined
                }
                confirmLabel="Delete Group"
                confirmHint='Type "Delete" below to confirm.'
                loadingLabel="Deleting..."
                isLoading={deleteGroupMutation.isPending}
            />

            <AcknowledgementPopup
                isOpen={notification.open}
                onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />
        </>
    );
}
