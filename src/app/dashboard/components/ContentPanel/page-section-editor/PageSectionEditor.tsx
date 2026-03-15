'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';

import { Plus } from 'lucide-react';

import type { ViewType } from '@/types/domain';
import { useEntries, usePageMeta } from '@/app/dashboard/hooks/use-editor-data';
import { useSectionMutations } from '@/app/dashboard/hooks/use-section-mutations';

import { SectionCard } from './SectionCard';

const VIEW_TYPE_OPTIONS: { value: ViewType; label: string }[] = [
    { value: 'list', label: 'List' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'grid', label: 'Grid' },
    { value: 'feature', label: 'Feature' },
];

export default function PageSectionEditor() {
    const { data: pageMeta } = usePageMeta();
    const { data: entries } = useEntries();
    const mutations = useSectionMutations();
    const [showTypeSelect, setShowTypeSelect] = useState(false);

    const sections = pageMeta?.sections ?? [];
    const entryMap = new Map(entries.map((e) => [e.id, e]));

    const resolveEntries = (entryIds: string[]) =>
        entryIds.map((id) => entryMap.get(id)).filter(Boolean) as typeof entries;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-4 py-3">
                <h2 className="text-sm font-medium text-dashboard-text">Page Sections</h2>
                <div className="relative">
                    <button
                        onClick={() => setShowTypeSelect(!showTypeSelect)}
                        className="flex items-center gap-1 rounded-md bg-dashboard-bg-hover px-2 py-1 text-xs text-dashboard-text-secondary hover:bg-dashboard-bg-active"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        섹션 추가
                    </button>
                    {showTypeSelect && (
                        <div className="absolute right-0 top-full z-10 mt-1 rounded-md border border-dashboard-border bg-dashboard-bg-card py-1 shadow-lg">
                            {VIEW_TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        mutations.addSection(opt.value);
                                        setShowTypeSelect(false);
                                    }}
                                    className="block w-full px-4 py-1.5 text-left text-xs text-dashboard-text hover:bg-dashboard-bg-hover"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section List */}
            <div className="flex-1 overflow-y-auto p-4">
                {sections.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-dashboard-text-placeholder">
                            섹션을 추가해서 페이지를 구성하세요
                        </p>
                    </div>
                ) : (
                    <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sections.map((section) => (
                            <SectionCard
                                key={section.id}
                                section={section}
                                entries={resolveEntries(section.entryIds)}
                                onUpdateField={(field) =>
                                    mutations.updateSectionField(section.id, field)
                                }
                                onDelete={() => mutations.removeSection(section.id)}
                                onRemoveEntry={(entryId) =>
                                    mutations.removeEntryFromSection(section.id, entryId)
                                }
                            />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
}
