'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    UsersRound,
    Plus,
    Trash2,
    UserPlus,
    UserMinus,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Loader2,
    Crown,
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

export default function CourseGroupsPage() {
    const params = useParams();
    const courseId = Number(params?.courseId);
    const queryClient = useQueryClient();

    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMaxMembers, setNewGroupMaxMembers] = useState(4);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const { data: groups = [], isLoading: groupsLoading } = useQuery({
        queryKey: ['course-groups', courseId],
        queryFn: () => apiClient.getCourseGroups(courseId),
        enabled: !!courseId,
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ['course-students', courseId],
        queryFn: async () => {
            const data = await apiClient.getCourseStudents(courseId);
            return (Array.isArray(data) ? data : []) as Student[];
        },
        enabled: !!courseId,
    });

    const activeStudents = students.filter((s) => s.status === 'active');

    const createGroupMutation = useMutation({
        mutationFn: () => apiClient.createCourseGroup(courseId, { name: newGroupName.trim(), max_members: newGroupMaxMembers }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setNewGroupName('');
            setNewGroupMaxMembers(4);
            showSuccess('Group created successfully.');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to create group.';
            showError(msg);
        },
    });

    const deleteGroupMutation = useMutation({
        mutationFn: (groupId: number) => apiClient.deleteCourseGroup(courseId, groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            showSuccess('Group deleted.');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to delete group.';
            showError(msg);
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
            apiClient.addGroupMember(courseId, groupId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            setAddMemberGroupId(null);
            setSelectedStudentId('');
            showSuccess('Student added to group.');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to add student.';
            showError(msg);
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
            apiClient.removeGroupMember(courseId, groupId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-groups', courseId] });
            showSuccess('Student removed from group.');
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to remove student.';
            showError(msg);
        },
    });

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setError(null);
        setTimeout(() => setSuccessMsg(null), 4000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setSuccessMsg(null);
        setTimeout(() => setError(null), 6000);
    };

    const toggleGroup = (groupId: number) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    // Get all user IDs already in a specific group
    const getMembersInGroup = (group: Group) => new Set(group.members.map((m) => m.user_id));

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UsersRound className="w-6 h-6 text-[#862733]" />
                        Student Groups
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create groups for group assignments and manage membership.
                    </p>
                </div>
                <div className="text-sm text-gray-500">
                    {groups.length} group{groups.length !== 1 ? 's' : ''} · {activeStudents.length} active students
                </div>
            </div>

            {/* Feedback messages */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    {successMsg}
                </div>
            )}

            {/* Create Group Card */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#862733]" />
                        Create New Group
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                            <Input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="e.g., Team Alpha"
                            />
                        </div>
                        <div className="w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={newGroupMaxMembers}
                                onChange={(e) => setNewGroupMaxMembers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                if (!newGroupName.trim()) { showError('Group name is required.'); return; }
                                createGroupMutation.mutate();
                            }}
                            disabled={createGroupMutation.isPending}
                            className="gap-2 bg-[#862733] hover:bg-[#6b1f2a] text-white whitespace-nowrap"
                        >
                            {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Group
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Groups List */}
            {groupsLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                    <UsersRound className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No groups yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first group above to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map((group) => {
                        const expanded = expandedGroups.has(group.id);
                        const memberIds = getMembersInGroup(group);
                        const availableStudents = activeStudents.filter((s) => !memberIds.has(s.id));
                        const isAddingToThis = addMemberGroupId === group.id;

                        return (
                            <Card key={group.id} className="border-gray-200 shadow-sm overflow-hidden">
                                <div
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-[#862733]/10 flex items-center justify-center flex-shrink-0">
                                            <UsersRound className="w-4 h-4 text-[#862733]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {group.members.length} / {group.max_members} members
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); deleteGroupMutation.mutate(group.id); }}
                                            disabled={deleteGroupMutation.isPending}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Delete group"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {expanded && (
                                    <CardContent className="pt-0 pb-4 border-t border-gray-100">
                                        {/* Members list */}
                                        {group.members.length === 0 ? (
                                            <p className="text-sm text-gray-400 py-4 text-center">No members yet. Add students below.</p>
                                        ) : (
                                            <div className="divide-y divide-gray-100 mb-4">
                                                {group.members.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between py-2.5 px-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-8 h-8 rounded-full bg-[#862733]/10 flex items-center justify-center text-[#862733] text-sm font-semibold flex-shrink-0">
                                                                {member.full_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                                                    {member.full_name}
                                                                    {member.is_leader && (
                                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                                            <Crown className="w-2.5 h-2.5" /> Leader
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMemberMutation.mutate({ groupId: group.id, userId: member.user_id })}
                                                            disabled={removeMemberMutation.isPending}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                                            title="Remove from group"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add member UI */}
                                        {group.members.length < group.max_members && (
                                            <div>
                                                {!isAddingToThis ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setAddMemberGroupId(group.id); setSelectedStudentId(''); }}
                                                        className="flex items-center gap-2 text-sm text-[#862733] font-medium hover:underline"
                                                    >
                                                        <UserPlus className="w-4 h-4" /> Add student
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2 mt-2">
                                                        {studentsLoading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                        ) : (
                                                            <>
                                                                <select
                                                                    value={selectedStudentId}
                                                                    onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
                                                                    className="flex-1 h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent"
                                                                >
                                                                    <option value="">Select a student...</option>
                                                                    {availableStudents.map((s) => (
                                                                        <option key={s.id} value={s.id}>
                                                                            {s.full_name} {s.student_id ? `(${s.student_id})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (!selectedStudentId) { showError('Please select a student.'); return; }
                                                                        addMemberMutation.mutate({ groupId: group.id, userId: Number(selectedStudentId) });
                                                                    }}
                                                                    disabled={addMemberMutation.isPending || !selectedStudentId}
                                                                    className="bg-[#862733] hover:bg-[#6b1f2a] text-white gap-1"
                                                                >
                                                                    {addMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                                                    Add
                                                                </Button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setAddMemberGroupId(null); setSelectedStudentId(''); }}
                                                                    className="text-sm text-gray-500 hover:text-gray-700 px-2"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {group.members.length >= group.max_members && (
                                            <p className="text-xs text-amber-600 mt-2">Group is at maximum capacity ({group.max_members}).</p>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
