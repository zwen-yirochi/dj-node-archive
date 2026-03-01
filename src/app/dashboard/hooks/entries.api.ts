// hooks/entries.api.ts
/**
 * Pure API functions + reorder helpers (no React dependencies)
 */

import type { ContentEntry } from '@/types';

// ============================================
// API Functions
// ============================================

export async function createEntry(params: {
    pageId: string;
    entry: ContentEntry;
    publishOption: string;
}): Promise<{ id: string }> {
    const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Failed to create entry: ${res.status}`);
    const json = await res.json();
    return json.data;
}

export async function updateEntry(params: {
    id: string;
    entry?: ContentEntry;
    displayOrder?: number | null;
    isVisible?: boolean;
}): Promise<void> {
    const { id, ...body } = params;
    const res = await fetch(`/api/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to update entry: ${res.status}`);
}

export async function deleteEntry(id: string): Promise<void> {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete entry: ${res.status}`);
}

export async function reorderEntries(updates: { id: string; position: number }[]): Promise<void> {
    const res = await fetch('/api/entries/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error(`Failed to reorder entries: ${res.status}`);
}

export async function reorderDisplay(
    updates: { id: string; displayOrder: number }[]
): Promise<void> {
    const res = await fetch('/api/entries/reorder-display', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error(`Failed to reorder display: ${res.status}`);
}

// ============================================
// Pure Reorder Helpers
// ============================================

export function computeReorderedPositions(
    entries: ContentEntry[],
    type: ContentEntry['type'],
    entryId: string,
    newPosition: number
): { id: string; position: number }[] | null {
    const sectionEntries = entries
        .filter((e) => e.type === type)
        .sort((a, b) => a.position - b.position);

    const currentIndex = sectionEntries.findIndex((e) => e.id === entryId);
    if (currentIndex === -1) return null;

    const reordered = [...sectionEntries];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newPosition, 0, moved);

    return reordered.map((entry, index) => ({ id: entry.id, position: index }));
}

export function computeReorderedDisplay(
    entries: ContentEntry[],
    entryId: string,
    newIndex: number
): { id: string; displayOrder: number }[] | null {
    const displayedEntries = entries
        .filter((e) => typeof e.displayOrder === 'number')
        .sort((a, b) => a.displayOrder! - b.displayOrder!);

    const currentIndex = displayedEntries.findIndex((e) => e.id === entryId);
    if (currentIndex === -1) return null;

    const reordered = [...displayedEntries];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    return reordered.map((entry, index) => ({ id: entry.id, displayOrder: index }));
}
