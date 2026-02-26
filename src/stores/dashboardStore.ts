import { create } from 'zustand';
import type { EntryType } from '@/app/dashboard/constants/entryConfig';

export type { EntryType };

// 사이드바 섹션 상태 타입
export interface SidebarSectionState {
    collapsed: boolean;
}

export type SidebarSections = {
    page: SidebarSectionState;
    events: SidebarSectionState;
    mixsets: SidebarSectionState;
    links: SidebarSectionState;
};

export type SectionKey = keyof SidebarSections;

// Discriminated union for content routing
export type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'page-detail'; entryId: string }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };

interface DashboardStore {
    contentView: ContentView;
    sidebarSections: SidebarSections;
    previewVersion: number;

    setView: (view: ContentView) => void;
    selectEntry: (id: string) => void;
    openCreatePanel: (type: EntryType) => void;
    closeCreatePanel: () => void;

    triggerPreviewRefresh: () => void;

    toggleSection: (section: SectionKey) => void;
    setSectionCollapsed: (section: SectionKey, collapsed: boolean) => void;
    reset: () => void;
}

const initialSidebarSections: SidebarSections = {
    page: { collapsed: false },
    events: { collapsed: false },
    mixsets: { collapsed: false },
    links: { collapsed: false },
};

export const useDashboardStore = create<DashboardStore>((set) => ({
    contentView: { kind: 'page' },
    sidebarSections: initialSidebarSections,
    previewVersion: 0,

    setView: (view) => set({ contentView: view }),

    selectEntry: (id) => set({ contentView: { kind: 'detail', entryId: id } }),

    openCreatePanel: (type) => set({ contentView: { kind: 'create', entryType: type } }),

    closeCreatePanel: () => set({ contentView: { kind: 'page' } }),

    triggerPreviewRefresh: () => set((state) => ({ previewVersion: state.previewVersion + 1 })),

    toggleSection: (section) =>
        set((state) => ({
            sidebarSections: {
                ...state.sidebarSections,
                [section]: {
                    collapsed: !state.sidebarSections[section].collapsed,
                },
            },
        })),

    setSectionCollapsed: (section, collapsed) =>
        set((state) => ({
            sidebarSections: {
                ...state.sidebarSections,
                [section]: { collapsed },
            },
        })),

    reset: () =>
        set({
            contentView: { kind: 'page' },
            sidebarSections: {
                page: { collapsed: false },
                events: { collapsed: false },
                mixsets: { collapsed: false },
                links: { collapsed: false },
            },
            previewVersion: 0,
        }),
}));
