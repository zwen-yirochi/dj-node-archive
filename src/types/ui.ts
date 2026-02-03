// ==============================================
// types/ui.ts - UI 전용 타입 (단일 소스)
// ==============================================

import type { ComponentData, User } from './domain';

// ----------------------------------------------
// Editor State
// ----------------------------------------------
export interface EditorState {
    user: User;
    components: ComponentData[];
    selectedComponentId: string | null;
    isDirty: boolean;
}

// ----------------------------------------------
// Artist Suggestion (자동완성)
// ----------------------------------------------
export interface ArtistSuggestion {
    username: string;
    displayName: string;
    avatarUrl: string;
}

// ----------------------------------------------
// Font & Icon Options
// ----------------------------------------------
export type FontOption = 'bebas' | 'instrument' | 'jetbrains';

export const ICON_OPTIONS = [
    'soundcloud',
    'spotify',
    'bandcamp',
    'instagram',
    'youtube',
    'twitter',
    'globe',
    'mail',
] as const;

export type IconOption = (typeof ICON_OPTIONS)[number];
