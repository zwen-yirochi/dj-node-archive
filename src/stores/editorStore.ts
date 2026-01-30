import type { ComponentData, User } from '@/types';
import { create } from 'zustand';

interface EditorStore {
    user: User | null;
    components: ComponentData[];
    pageId: string | null;

    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;
    setComponents: (components: ComponentData[]) => void;
    setPageId: (pageId: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
    user: null,
    components: [],
    pageId: null,

    setUser: (user) => set({ user }),

    updateUser: (updates) =>
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
        })),

    setComponents: (components) => set({ components }),

    setPageId: (pageId) => set({ pageId }),
}));
