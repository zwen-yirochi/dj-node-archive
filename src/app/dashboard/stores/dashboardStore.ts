import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { EntryType } from '../config/entry/entry-types';

export type { EntryType };

// Sidebar section state type
export interface SidebarSectionState {
    collapsed: boolean;
}

export type SidebarSections = {
    page: SidebarSectionState;
    events: SidebarSectionState;
    mixsets: SidebarSectionState;
    links: SidebarSectionState;
    custom: SidebarSectionState;
};

export type SectionKey = keyof SidebarSections;

// Discriminated union for content routing
export type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };

// Keep as a single store: splitting into 3 states + 4 actions only adds boilerplate.
// Zustand selectors already prevent unnecessary re-renders.
interface DashboardStore {
    contentView: ContentView;
    previousView: ContentView | null;
    navigatedFromPageList: boolean;
    sidebarSections: SidebarSections;
    pageId: string | null;
    isSettingsOpen: boolean;

    setView: (view: ContentView, options?: { replace?: boolean; fromPageList?: boolean }) => void;
    goBack: () => void;
    toggleSection: (section: SectionKey) => void;
    setPageId: (pageId: string | null) => void;
    setSettingsOpen: (open: boolean) => void;
    reset: () => void;
}

const initialSidebarSections: SidebarSections = {
    page: { collapsed: false },
    events: { collapsed: false },
    mixsets: { collapsed: false },
    links: { collapsed: false },
    custom: { collapsed: false },
};

const DEFAULT_STATE = {
    contentView: { kind: 'page' } as ContentView,
    previousView: null as ContentView | null,
    navigatedFromPageList: false,
    sidebarSections: initialSidebarSections,
    pageId: null as string | null,
    isSettingsOpen: false,
};

export const useDashboardStore = create<DashboardStore>()(
    devtools<DashboardStore>(
        (set) => ({
            ...DEFAULT_STATE,

            setView: (view, options) =>
                set(
                    (state) => ({
                        contentView: view,
                        previousView: options?.replace ? state.previousView : state.contentView,
                        navigatedFromPageList: !!options?.fromPageList,
                    }),
                    undefined,
                    'setView'
                ),

            goBack: () =>
                set(
                    (state) => ({
                        contentView: state.previousView ?? { kind: 'page' },
                        previousView: null,
                        navigatedFromPageList: false,
                    }),
                    undefined,
                    'goBack'
                ),

            setPageId: (pageId) => set({ pageId }, undefined, 'setPageId'),

            setSettingsOpen: (open) => set({ isSettingsOpen: open }, undefined, 'setSettingsOpen'),

            toggleSection: (section) =>
                set(
                    (state) => ({
                        sidebarSections: {
                            ...state.sidebarSections,
                            [section]: {
                                collapsed: !state.sidebarSections[section].collapsed,
                            },
                        },
                    }),
                    undefined,
                    'toggleSection'
                ),

            reset: () => set(DEFAULT_STATE, undefined, 'reset'),
        }),
        { name: 'DashboardStore', enabled: process.env.NODE_ENV === 'development' }
    )
);

// ============================================
// Selectors (referential stability)
// ============================================

export const selectContentView = (s: DashboardStore) => s.contentView;
export const selectSetView = (s: DashboardStore) => s.setView;
export const selectGoBack = (s: DashboardStore) => s.goBack;
export const selectHasPreviousView = (s: DashboardStore) => s.navigatedFromPageList;
export const selectSidebarSections = (s: DashboardStore) => s.sidebarSections;
export const selectToggleSection = (s: DashboardStore) => s.toggleSection;
export const selectPageId = (s: DashboardStore) => s.pageId;
export const selectIsSettingsOpen = (s: DashboardStore) => s.isSettingsOpen;
export const selectSetSettingsOpen = (s: DashboardStore) => s.setSettingsOpen;
