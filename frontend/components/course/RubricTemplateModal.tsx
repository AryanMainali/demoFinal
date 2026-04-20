'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { AcknowledgementPopup } from '@/components/ui/acknowledgement-popup';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LevelDescriptor {
    score: number;
    comment: string;
}

export interface TemplateItem {
    name: string;
    description: string;
    min_scale: number;
    max_scale: number;
    points: number;
    sort_order: number;
    levels: LevelDescriptor[];
}

export interface RubricTemplateData {
    title: string;
    description: string;
    items: TemplateItem[];
}

interface RubricTemplateEditorProps {
    initialData?: RubricTemplateData;
    onSave: (data: RubricTemplateData) => Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
    title?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLevels(min: number, max: number, existing: LevelDescriptor[]): LevelDescriptor[] {
    const existingMap = new Map(existing.map((l) => [l.score, l.comment]));
    const levels: LevelDescriptor[] = [];
    for (let s = Math.round(min); s <= Math.round(max); s++) {
        levels.push({ score: s, comment: existingMap.get(s) ?? '' });
    }
    return levels;
}

function emptyItem(index: number): TemplateItem {
    return {
        name: `Criterion ${index + 1}`,
        description: '',
        min_scale: 0,
        max_scale: 5,
        points: 0,
        sort_order: index,
        levels: buildLevels(0, 5, []),
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RubricTemplateEditor({
    initialData,
    onSave,
    onCancel,
    isSaving = false,
    title = 'Create Rubric Template',
}: RubricTemplateEditorProps) {
    const [templateTitle, setTemplateTitle] = useState('');
    const [templateDesc, setTemplateDesc] = useState('');
    const [items, setItems] = useState<TemplateItem[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
    const [errorModal, setErrorModal] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setTemplateTitle(initialData.title);
            setTemplateDesc(initialData.description ?? '');
            setItems(initialData.items.map((item, i) => ({
                ...item,
                levels: buildLevels(item.min_scale, item.max_scale, item.levels),
                sort_order: i,
            })));
        } else {
            setTemplateTitle('');
            setTemplateDesc('');
            setItems([emptyItem(0)]);
        }
        setExpandedItems(new Set([0]));
        setErrorModal(null);
    }, [initialData]);

    const toggleItem = (i: number) =>
        setExpandedItems((prev) => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });

    const addItem = () => {
        const next = [...items, emptyItem(items.length)];
        setItems(next);
        setExpandedItems((prev) => new Set([...prev, next.length - 1]));
    };

    const removeItem = (i: number) => {
        setItems((prev) => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, sort_order: idx })));
        setExpandedItems((prev) => {
            const next = new Set<number>();
            prev.forEach((v) => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); });
            return next;
        });
    };

    const updateItem = (i: number, field: keyof TemplateItem, value: string | number) => {
        setItems((prev) => {
            const updated = [...prev];
            const item = { ...updated[i], [field]: value };
            if (field === 'min_scale' || field === 'max_scale') {
                const min = field === 'min_scale' ? Number(value) : item.min_scale;
                const max = field === 'max_scale' ? Number(value) : item.max_scale;
                if (max > min) {
                    item.levels = buildLevels(min, max, item.levels);
                }
            }
            updated[i] = item;
            return updated;
        });
    };

    const updateLevel = (itemIdx: number, score: number, comment: string) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[itemIdx] = {
                ...updated[itemIdx],
                levels: updated[itemIdx].levels.map((l) =>
                    l.score === score ? { ...l, comment } : l
                ),
            };
            return updated;
        });
    };

    const totalPoints = items.reduce((s, i) => s + (Number(i.points) || 0), 0);
    const pointsOk = Math.round(totalPoints * 10) === 1000; // 100.0

    const handleSave = async () => {
        if (!templateTitle.trim()) {
            setErrorModal('Template title is required.');
            return;
        }
        if (items.find((it) => !it.name.trim())) {
            setErrorModal('All criteria must have a name.');
            return;
        }
        if (!pointsOk) {
            setErrorModal(`Total points across all criteria must equal 100. Current total: ${totalPoints}.`);
            return;
        }
        try {
            await onSave({
                title: templateTitle.trim(),
                description: templateDesc.trim(),
                items: items.map((it, idx) => ({ ...it, sort_order: idx })),
            });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setErrorModal(typeof msg === 'string' ? msg : 'Failed to save template.');
        }
    };

    return (
        <div className="space-y-6">
            <AcknowledgementPopup
                isOpen={!!errorModal}
                onClose={() => setErrorModal(null)}
                type="error"
                title="Validation Error"
                message={errorModal ?? ''}
                description="Please fix the issue below before saving."
                acknowledgeLabel="OK"
            />

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">Define grading criteria with per-score level comments</p>
                </div>
            </div>

            {/* Template meta */}
            <div className="grid grid-cols-1 gap-4">
                <Input
                    label="Template Title"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="e.g. Programming Assignment Rubric"
                    required
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
                    </label>
                    <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows={2}
                        value={templateDesc}
                        onChange={(e) => setTemplateDesc(e.target.value)}
                        placeholder="Brief description of this rubric template..."
                    />
                </div>
            </div>

            {/* Points summary */}
            {items.length > 0 && (
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                    pointsOk
                        ? 'bg-green-50 border-green-200 text-green-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                    <span>{items.length} criteria defined</span>
                    <span className="font-semibold">
                        Total: {totalPoints.toFixed(1)} / 100 pts{pointsOk && ' ✓'}
                    </span>
                </div>
            )}

            {/* Criteria */}
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Criterion header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                {i + 1}
                            </div>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(i, 'name', e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Criterion name"
                            />
                            <button
                                type="button"
                                onClick={() => toggleItem(i)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {expandedItems.has(i) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => removeItem(i)}
                                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedItems.has(i) && (
                            <div className="px-4 py-4 space-y-4">
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-400"
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                                    placeholder="Describe what this criterion evaluates..."
                                />

                                {/* Scale Min / Scale Max / Total Points */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                                            Scale Min
                                            <span className="ml-1 text-gray-400 font-normal normal-case text-[10px]">(= 0 pts)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={item.min_scale}
                                            onChange={(e) => updateItem(i, 'min_scale', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                                            Scale Max
                                            <span className="ml-1 text-gray-400 font-normal normal-case text-[10px]">(= total pts)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={item.max_scale}
                                            onChange={(e) => updateItem(i, 'max_scale', parseFloat(e.target.value) || 5)}
                                            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Total Pts</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={item.points}
                                            onChange={(e) => updateItem(i, 'points', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Per-score level descriptors */}
                                <div>
                                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                                        Score Level Comments
                                        <span className="ml-1.5 text-gray-400 font-normal normal-case">(pre-written comment for each grade value)</span>
                                    </p>
                                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide w-16">Score</th>
                                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Instructor Comment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {item.levels.map((level) => (
                                                    <tr key={level.score} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-3 py-2">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">
                                                                {level.score}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input
                                                                type="text"
                                                                value={level.comment}
                                                                onChange={(e) => updateLevel(i, level.score, e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300"
                                                                placeholder={`Comment for score ${level.score}…`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <Button
                    type="button"
                    onClick={addItem}
                    className="w-full h-10 gap-2 text-sm font-medium rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Criterion
                </Button>
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-white px-6 gap-2"
                >
                    {isSaving ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    ) : (
                        'Save Template'
                    )}
                </Button>
            </div>
        </div>
    );
}
