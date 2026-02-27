import { create } from 'zustand';
import type { EntryType } from '../config/entryConfig';

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

// 단일 스토어 유지: state 3개 + action 4개로 분리 시 보일러플레이트만 증가.
// Zustand 셀렉터가 이미 불필요한 리렌더 방지.
interface DashboardStore {
    contentView: ContentView;
    sidebarSections: SidebarSections;
    previewVersion: number;

    setView: (view: ContentView) => void;
    triggerPreviewRefresh: () => void;
    toggleSection: (section: SectionKey) => void;
    reset: () => void;
}

const initialSidebarSections: SidebarSections = {
    page: { collapsed: false },
    events: { collapsed: false },
    mixsets: { collapsed: false },
    links: { collapsed: false },
};

const DEFAULT_STATE = {
    contentView: { kind: 'page' } as ContentView,
    sidebarSections: initialSidebarSections,
    previewVersion: 0,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
    ...DEFAULT_STATE,

    setView: (view) => set({ contentView: view }),

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

    reset: () => set(DEFAULT_STATE),
}));
