// ==============================================
// types/index.ts - 중앙 진입점 (re-export only)
// ==============================================

// Domain types (핵심 비즈니스 타입)
export type {
    User,
    Theme,
    AccentColor,
    BackgroundStyle,
    ThemePreset,
    EventComponent,
    MixsetComponent,
    LinkComponent,
    ComponentData,
    ComponentType,
    Page,
    Backlink,
} from './domain';

export { THEME_PRESETS } from './domain';

// UI types (에디터, 폰트, 아이콘 등)
export type { EditorState, ArtistSuggestion, FontOption, IconOption } from './ui';

export { ICON_OPTIONS } from './ui';

// Result types (에러 처리)
export * from './result';

// Type guards
export * from './guards';
