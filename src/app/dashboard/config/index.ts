/**
 * Entry Registry — single entry point for all per-EntryType configurations.
 *
 * Individual config files remain the source of truth for their domain.
 * This barrel provides:
 * 1. Unified import path for consumers
 * 2. Compile-time EntryType completeness (all Record<EntryType, ...> enforce it)
 */

// === Core type (source of truth) ===
export { ENTRY_TYPE_CONFIG, type EntryType } from './entryConfig';

// === Sidebar ===
export { SIDEBAR_CONFIG, COMPONENT_GROUPS, type ComponentGroupConfig } from './sidebarConfig';

// === Menu system ===
export {
    EDITOR_MENU_CONFIG,
    TREE_ENTRY_MENU,
    TREE_PAGE_DISPLAY_MENU,
    resolveMenuItems,
    resolveTreeMenuItems,
    type MenuAction,
    type MenuActionContext,
    type EditorMenuItemConfig,
    type TreeMenuItemConfig,
    type TreeMenuActionContext,
} from './menuConfig';

// === Field metadata & validation ===
export {
    FIELD_CONFIG,
    ENTRY_SCHEMAS,
    validateEntry,
    canCreate,
    canAddToView,
    getMissingFieldLabels,
    getTreeItemStatus,
    type FieldConfig,
    type TreeItemStatus,
    type ValidationResult,
} from './entryFieldConfig';

// === Detail view field blocks ===
export {
    FIELD_BLOCKS,
    EVENT_FIELD_BLOCKS,
    MIXSET_FIELD_BLOCKS,
    LINK_FIELD_BLOCKS,
} from './fieldBlockConfig';

// === Create form configs ===
export {
    FORM_CONFIGS,
    EVENT_FORM_CONFIG,
    MIXSET_FORM_CONFIG,
    LINK_FORM_CONFIG,
} from './entryFormConfig';

// === Custom block system ===
export {
    SECTION_BLOCK_CONFIG,
    SECTION_BLOCK_TYPES,
    createBlock,
    blockSchemas,
    type SectionBlockConfig,
} from './customBlockConfig';
