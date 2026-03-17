import type { DragEndEvent } from '@dnd-kit/core';

import type { QueryClient } from '@tanstack/react-query';

import type { ContentEntry, Section } from '@/types/domain';
import type { PageMeta } from '@/app/dashboard/hooks/use-editor-data';

// ── Drag Data (각 draggable/droppable이 전달하는 메타데이터) ──

export interface DragData {
    type: 'entry' | 'sidebar-entry' | 'section' | 'section-entry' | 'section-drop';
    entry?: ContentEntry;
    sectionId?: string;
    section?: Section;
    variant?: 'list' | 'card';
}

// ── Drag Context (전략이 접근하는 의존성 번들) ──

export interface DragContext {
    getEntries: () => ContentEntry[];
    getPageMeta: () => PageMeta | undefined;
    queryClient: QueryClient;
    reorderEntriesMutation: {
        mutate: (
            variables: { updates: { id: string; position: number }[] },
            options?: { onError?: () => void }
        ) => void;
    };
    sectionMutations: {
        setSections: (updater: (prev: Section[]) => Section[]) => void;
        saveMutation: { mutate: () => void };
        addEntryToSection: (sectionId: string, entryId: string) => void;
        reorderEntryInSection: (sectionId: string, fromIndex: number, toIndex: number) => void;
        moveEntryBetweenSections: (
            fromSectionId: string,
            toSectionId: string,
            entryId: string,
            toIndex: number
        ) => void;
    };
}

// ── Drag Strategy ──

export interface DragStrategy {
    /** 이 전략이 처리할 active 드래그 타입 */
    activeTypes: DragData['type'][];

    /** collision detection: 이 active 타입일 때 허용할 droppable 필터 */
    acceptsOver: (activeData: DragData, overData: DragData) => boolean;

    /** onDragEnd — 드롭 처리 */
    onEnd: (event: DragEndEvent, ctx: DragContext) => void;
}
