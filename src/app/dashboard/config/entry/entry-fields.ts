/**
 * Entry field metadata + TreeItem status helpers
 */

import type { EntryType } from './entry-types';

// ============================================
// Field metadata
// ============================================

export interface FieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean;
}

export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'date', label: 'Date', triggersPreview: true },
        { key: 'venue', label: 'Venue', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'lineup', label: 'Lineup', triggersPreview: true },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    mixset: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'tracklist', label: 'Tracklist', triggersPreview: false },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    link: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'url', label: 'URL', triggersPreview: true },
        { key: 'imageUrls', label: 'Images', triggersPreview: true },
        { key: 'icon', label: 'Icon', triggersPreview: true },
        { key: 'description', label: 'Description', triggersPreview: false },
    ],
    custom: [
        { key: 'title', label: 'Title', triggersPreview: true },
        { key: 'blocks', label: 'Blocks', triggersPreview: true },
    ],
};

// ============================================
// TreeItem status
// ============================================

export type TreeItemStatus = 'inView' | 'normal' | 'warning';

export function getTreeItemStatus(isInView: boolean, isValid: boolean): TreeItemStatus {
    if (!isValid) return 'warning';
    if (isInView) return 'inView';
    return 'normal';
}
