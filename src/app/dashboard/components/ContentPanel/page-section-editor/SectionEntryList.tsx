import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { ContentEntry, ViewType } from '@/types/domain';

import { SectionEntryItem } from './SectionEntryItem';

interface Props {
    sectionId: string;
    viewType: ViewType;
    entries: ContentEntry[];
    onRemoveEntry: (entryId: string) => void;
}

export function SectionEntryList({ sectionId, viewType, entries, onRemoveEntry }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable:${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    const sortableIds = entries.map((e) => `${sectionId}:${e.id}`);

    const layoutClass = getLayoutClass(viewType);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[40px] rounded-md border border-dashed transition-colors ${
                isOver ? 'border-blue-400 bg-blue-400/5' : 'border-transparent'
            }`}
        >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {entries.length === 0 ? (
                    <EmptyState viewType={viewType} />
                ) : (
                    <div className={layoutClass}>
                        {entries.map((entry) => (
                            <SectionEntryItem
                                key={entry.id}
                                entry={entry}
                                sectionId={sectionId}
                                compact={viewType === 'carousel'}
                                onRemove={() => onRemoveEntry(entry.id)}
                            />
                        ))}
                    </div>
                )}
            </SortableContext>
        </div>
    );
}

function getLayoutClass(viewType: ViewType): string {
    switch (viewType) {
        case 'carousel':
            return 'flex gap-1 overflow-x-auto scrollbar-hide';
        case 'feature':
        case 'list':
        default:
            return 'space-y-0';
    }
}

function EmptyState({ viewType }: { viewType: ViewType }) {
    const hints: Record<string, string> = {
        carousel: '가로로 스크롤되는 카드',
        list: '세로 리스트 형태',
        feature: '첫 번째 엔트리를 강조',
    };

    return (
        <p className="py-3 text-center text-xs text-dashboard-text-placeholder">
            엔트리를 드래그해서 추가하세요 · {hints[viewType]}
        </p>
    );
}
