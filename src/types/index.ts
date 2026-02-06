// types/index.ts - 중앙 진입점 (re-export only)

// ============================================
// Domain types (UI/프론트엔드용)
// ============================================
export type {
    Artist,
    Backlink,
    // Entries
    ContentEntry,
    ContentEntryType,
    Event,
    EventEntry,
    LinkEntry,
    Mixset,
    MixsetEntry,
    Page,
    // User & Page
    User,
    // Entities
    Venue,
} from './domain';

// Type guards
export { isEventEntry, isLinkEntry, isMixsetEntry } from './domain';

// Helper functions for display state
export { isDisplayed, isVisibleOnPage } from './domain';

// Legacy aliases (호환성)
export {
    isEventComponent,
    isLinkComponent,
    isMixsetComponent,
    type EventComponent,
    type LinkComponent,
    type MixsetComponent,
} from './domain';

// ============================================
// UI types (에디터, 폰트, 아이콘 등)
// ============================================
export { ICON_OPTIONS } from './ui';
export type { ArtistSuggestion, EditorState, FontOption, IconOption } from './ui';

// ============================================
// Result types (에러 처리)
// ============================================
export * from './result';

// ============================================
// Type guards (추가)
// ============================================
export * from './guards';
