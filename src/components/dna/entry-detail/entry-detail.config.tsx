import type { ComponentType } from 'react';

import type { EntryType } from '@/types/database';
import type { ContentEntry, User } from '@/types/domain';
import { formatEventDate } from '@/lib/formatters';

import { RichtextBlockView } from './block-views/RichtextBlockView';
import { BlockRenderer } from './BlockRenderer';
import { CoverImage } from './CoverImage';
import { ExternalLinks } from './ExternalLinks';
import { MetaSection } from './MetaSection';
import { TracklistTimeline } from './TracklistTimeline';

// Link를 제외한 상세 페이지 대상 타입
export type DetailableEntryType = Exclude<EntryType, 'link'>;

export interface SectionConfig {
    component: ComponentType<{ entry: ContentEntry }>;
}

export interface EntryDetailConfig {
    sections: SectionConfig[];
    generateMeta: (
        entry: ContentEntry,
        user: User
    ) => {
        title: string;
        description: string;
        images: string[];
    };
}

// --- 타입별 섹션 컴포넌트 ---

function EventDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'event') return null;
    return (
        <>
            <CoverImage src={entry.imageUrls?.[0]} alt={entry.title} />
            <MetaSection
                label="Event Info"
                labelRight="META"
                items={[
                    { key: 'Title', value: entry.title },
                    { key: 'Date', value: formatEventDate(entry.date) },
                    { key: 'Venue', value: entry.venue?.name || 'NULL' },
                    { key: 'Lineup', value: `${entry.lineup.length} artists` },
                ]}
            />
            {entry.description && <RichtextBlockView data={{ content: entry.description }} />}
            {entry.links && <ExternalLinks links={entry.links} />}
        </>
    );
}

function MixsetDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'mixset') return null;
    return (
        <>
            <CoverImage src={entry.imageUrls?.[0]} alt={entry.title} />
            <MetaSection
                label="Mixset Info"
                labelRight="META"
                items={[
                    ...(entry.durationMinutes
                        ? [{ key: 'Duration', value: `${entry.durationMinutes} min` }]
                        : []),
                    ...(entry.url ? [{ key: 'URL', value: entry.url, href: entry.url }] : []),
                ]}
            />
            <TracklistTimeline tracklist={entry.tracklist} />
            {entry.description && <RichtextBlockView data={{ content: entry.description }} />}
        </>
    );
}

function CustomDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'custom') return null;
    return <BlockRenderer blocks={entry.blocks} />;
}

export const entryDetailConfig: Record<DetailableEntryType, EntryDetailConfig> = {
    event: {
        sections: [{ component: EventDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description:
                entry.type === 'event'
                    ? `${entry.title} @ ${entry.venue?.name || ''} — ${formatEventDate(entry.date)}`
                    : entry.title,
            images: entry.type !== 'custom' ? (entry.imageUrls?.slice(0, 1) ?? []) : [],
        }),
    },
    mixset: {
        sections: [{ component: MixsetDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description:
                entry.type === 'mixset' && entry.durationMinutes
                    ? `${entry.title} (${entry.durationMinutes}min)`
                    : entry.title,
            images: entry.type !== 'custom' ? (entry.imageUrls?.slice(0, 1) ?? []) : [],
        }),
    },
    custom: {
        sections: [{ component: CustomDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description: entry.title,
            images: [],
        }),
    },
};
