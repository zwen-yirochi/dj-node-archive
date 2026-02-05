// types/index.ts - 중앙 진입점 (re-export only)

// ============================================
// Domain types (UI/프론트엔드용)
// ============================================
export type {
    // User & Page
    User,
    Page,
    // Entries
    ContentEntry,
    ContentEntryType,
    EventEntry,
    MixsetEntry,
    LinkEntry,
    // Entities
    Venue,
    Artist,
    Event,
    Mixset,
    Backlink,
} from './domain';

// Type guards
export { isEventEntry, isMixsetEntry, isLinkEntry } from './domain';

// Legacy aliases (호환성)
export {
    type EventComponent,
    type MixsetComponent,
    type LinkComponent,
    isEventComponent,
    isMixsetComponent,
    isLinkComponent,
} from './domain';

// ============================================
// UI types (에디터, 폰트, 아이콘 등)
// ============================================
export type { ArtistSuggestion, EditorState, FontOption, IconOption } from './ui';
export { ICON_OPTIONS } from './ui';

// ============================================
// Result types (에러 처리)
// ============================================
export * from './result';

// ============================================
// Type guards (추가)
// ============================================
export * from './guards';
