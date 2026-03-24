// types/ra-import.ts
// RA Import API 응답 타입 (Artist migration + Single event)

import type { PreviewEventItem } from './ra';

/** Artist migration preview response */
export interface ArtistImportPreview {
    artist: {
        name: string;
        eventCount: number;
    };
    sampleEvents: PreviewEventItem[];
}

/** Artist migration confirm response */
export interface ArtistImportResult {
    artist: { name: string };
    totalEvents: number;
    successCount: number;
    failedCount: number;
    failedEvents: { title: string; reason: string }[];
}

/** Single event import response */
export interface SingleEventImportResult {
    entry: {
        id: string;
        slug: string;
    };
    event: {
        title: string;
        date: string;
        venue: string;
    };
}

/** Artist migration status (from import_logs) */
export interface ArtistMigrationStatus {
    completed: boolean;
    artistName?: string;
    eventCount?: number;
    completedAt?: string;
}
