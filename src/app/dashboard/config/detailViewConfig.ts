/**
 * DetailView field layout configuration
 *
 * 각 EntryType의 DetailView가 어떤 필드를 어떤 순서로 렌더링하는지 선언한다.
 * 렌더링 로직은 UnifiedDetailView가 담당한다.
 */

import type { TracklistItem } from '@/types';
import type { KeyValueColumn } from '@/app/dashboard/components/ContentPanel/shared-fields/KeyValueField';
import type { ImageAspectRatio } from '@/app/dashboard/components/ContentPanel/shared-fields/types';

// ============================================
// Field slot types
// ============================================

interface TitleSlot {
    field: 'title';
    placeholder: string;
}

interface ImageSlot {
    field: 'image';
    aspectRatio: ImageAspectRatio;
    maxCount: number;
}

interface DateSlot {
    field: 'date';
}

interface VenueSlot {
    field: 'venue';
}

interface LineupSlot {
    field: 'lineup';
}

interface UrlSlot {
    field: 'url';
}

interface IconSlot {
    field: 'icon';
}

interface DescriptionSlot {
    field: 'description';
}

interface TracklistSlot {
    field: 'tracklist';
    columns: KeyValueColumn[];
    emptyItem: TracklistItem;
}

export type DetailFieldSlot =
    | TitleSlot
    | ImageSlot
    | DateSlot
    | VenueSlot
    | LineupSlot
    | UrlSlot
    | IconSlot
    | DescriptionSlot
    | TracklistSlot;

// ============================================
// Config per entry type
// ============================================

export const DETAIL_VIEW_CONFIG: Record<'event' | 'mixset' | 'link', DetailFieldSlot[]> = {
    event: [
        { field: 'title', placeholder: 'Event title' },
        { field: 'image', aspectRatio: 'portrait', maxCount: 10 },
        { field: 'date' },
        { field: 'venue' },
        { field: 'lineup' },
        { field: 'description' },
    ],
    mixset: [
        { field: 'title', placeholder: 'Mixset title' },
        { field: 'image', aspectRatio: 'square', maxCount: 1 },
        { field: 'url' },
        { field: 'description' },
        {
            field: 'tracklist',
            columns: [
                {
                    key: 'time',
                    placeholder: '0:00',
                    width: 'w-12 shrink-0',
                    className: 'font-mono text-xs text-dashboard-text-placeholder',
                },
                { key: 'track', placeholder: 'Track title', width: 'min-w-0 flex-1' },
                {
                    key: 'artist',
                    placeholder: 'Artist',
                    className: 'text-dashboard-text-placeholder',
                },
            ],
            emptyItem: { track: '', artist: '', time: '0:00' },
        },
    ],
    link: [
        { field: 'icon' },
        { field: 'title', placeholder: 'Link title' },
        { field: 'image', aspectRatio: 'video', maxCount: 1 },
        { field: 'url' },
        { field: 'description' },
    ],
};
