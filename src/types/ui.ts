// types/ui.ts - UI 전용 (에디터 상태 등)
import type { ComponentData, User } from './domain';

export interface EditorState {
    user: User;
    components: ComponentData[];
    selectedComponentId: string | null;
    isDirty: boolean;
}

export interface ArtistSuggestion {
    username: string;
    displayName: string;
    avatarUrl: string;
}

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
