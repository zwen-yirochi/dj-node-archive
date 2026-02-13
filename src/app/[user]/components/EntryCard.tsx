'use client';

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import type {
    ContentEntry,
    EventEntry,
    MixsetEntry,
    LinkEntry,
    isEventEntry,
    isMixsetEntry,
    isLinkEntry,
} from '@/types/domain';

interface Props {
    entry: ContentEntry;
    index: number;
}

// -- Animations --
const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const accentPulse = keyframes`
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
`;

// -- Styled Components --
const Card = styled.article<{ delay: number }>`
    display: grid;
    grid-template-columns: 3px 44px 1fr auto;
    gap: 0 12px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    animation: ${fadeInUp} 0.5s ease-out ${(p) => p.delay}s both;
    transition: background 0.2s ease;
    cursor: default;

    &:hover {
        background: rgba(0, 0, 0, 0.02);
    }
`;

const AccentBar = styled.div<{ entryType: string }>`
    width: 3px;
    height: 100%;
    border-radius: 1px;
    background: ${(p) =>
        p.entryType === 'event' ? '#1a1a1a' : p.entryType === 'mixset' ? '#6b6b6b' : '#999'};
    animation: ${accentPulse} 3s ease-in-out infinite;
    grid-row: 1 / -1;
`;

const Thumbnail = styled.div`
    width: 44px;
    height: 44px;
    border-radius: 2px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    grid-row: 1 / -1;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const ThumbnailFallback = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Content = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const TitleRow = styled.div`
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
`;

const Title = styled.h3`
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 0;
    color: #1a1a1a;
    line-height: 1.3;
`;

const Description = styled.span`
    font-size: 10px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
`;

const MetaGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const MetaRow = styled.div`
    font-size: 10px;
    color: #6b6b6b;
    letter-spacing: 0.04em;

    span {
        color: #999;
        margin-right: 8px;
    }
`;

const SideValue = styled.div`
    font-size: 10px;
    color: #999;
    text-align: right;
    white-space: nowrap;
    align-self: start;
    padding-top: 2px;
    letter-spacing: 0.04em;
`;

// -- Helpers --
function getImageUrl(entry: ContentEntry): string | undefined {
    if (entry.type === 'event') return (entry as EventEntry).posterUrl;
    if (entry.type === 'mixset') return (entry as MixsetEntry).coverUrl;
    return undefined;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            })
            .toUpperCase();
    } catch {
        return dateStr;
    }
}

function renderMeta(entry: ContentEntry) {
    switch (entry.type) {
        case 'event': {
            const e = entry as EventEntry;
            return (
                <MetaGrid>
                    <MetaRow>
                        <span>VNU</span>
                        {e.venue.name}
                    </MetaRow>
                    {e.lineup.length > 0 && (
                        <MetaRow>
                            <span>LNP</span>
                            {e.lineup.map((a) => a.name).join(', ')}
                        </MetaRow>
                    )}
                    <MetaRow>
                        <span>DTE</span>
                        {formatDate(e.date)}
                    </MetaRow>
                </MetaGrid>
            );
        }
        case 'mixset': {
            const m = entry as MixsetEntry;
            return (
                <MetaGrid>
                    {m.durationMinutes && (
                        <MetaRow>
                            <span>DUR</span>
                            {m.durationMinutes}MIN
                        </MetaRow>
                    )}
                    {m.tracklist.length > 0 && (
                        <MetaRow>
                            <span>TRK</span>
                            {m.tracklist.length} TRACKS
                        </MetaRow>
                    )}
                    <MetaRow>
                        <span>DTE</span>
                        {formatDate(entry.createdAt)}
                    </MetaRow>
                </MetaGrid>
            );
        }
        case 'link': {
            const l = entry as LinkEntry;
            return (
                <MetaGrid>
                    <MetaRow>
                        <span>URL</span>
                        {new URL(l.url).hostname}
                    </MetaRow>
                </MetaGrid>
            );
        }
    }
}

function getSideValue(entry: ContentEntry): string {
    if (entry.type === 'event') {
        return formatDate((entry as EventEntry).date);
    }
    if (entry.type === 'mixset' && (entry as MixsetEntry).durationMinutes) {
        return `${(entry as MixsetEntry).durationMinutes}m`;
    }
    return entry.type.toUpperCase();
}

export default function EntryCard({ entry, index }: Props) {
    const imageUrl = getImageUrl(entry);

    return (
        <Card delay={0.1 + index * 0.08}>
            <AccentBar entryType={entry.type} />
            <Thumbnail>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={entry.type === 'link' ? (entry as LinkEntry).title : ''}
                    />
                ) : (
                    <ThumbnailFallback>{entry.type.slice(0, 3)}</ThumbnailFallback>
                )}
            </Thumbnail>
            <Content>
                <TitleRow>
                    <Title>
                        {entry.type === 'event'
                            ? (entry as EventEntry).title
                            : entry.type === 'mixset'
                              ? (entry as MixsetEntry).title
                              : (entry as LinkEntry).title}
                    </Title>
                    {entry.type === 'event' && (entry as EventEntry).description && (
                        <Description>{(entry as EventEntry).description}</Description>
                    )}
                </TitleRow>
                {renderMeta(entry)}
            </Content>
            <SideValue>{getSideValue(entry)}</SideValue>
        </Card>
    );
}
