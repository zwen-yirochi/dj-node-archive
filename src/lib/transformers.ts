import type { ContentEntry, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import type { DBEvent } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * DB 이벤트 데이터를 EventComponent로 변환
 */
export function eventToEntry(event: DBEvent): EventComponent {
    return {
        id: uuidv4(),
        type: 'event',
        title: event.title || '',
        date: event.date,
        venue: event.venue?.name || '',
        venueId: event.venue?.venue_id,
        posterUrl: event.data?.poster_url || '',
        lineup: event.lineup?.map((item) => item.name) || [],
        description: event.data?.description || '',
        links: event.data?.links || [],
        eventId: event.id,
    };
}

/** @deprecated Use eventToEntry instead */
export const eventToComponent = eventToEntry;

/**
 * 빈 엔트리 템플릿 생성
 */
export function createEmptyEntry(type: 'event' | 'mixset' | 'link'): ContentEntry {
    const id = uuidv4();

    switch (type) {
        case 'event':
            return {
                id,
                type: 'event',
                title: '',
                date: new Date().toISOString().split('T')[0],
                venue: '',
                posterUrl: '',
                lineup: [],
                description: '',
                links: [],
            } as EventComponent;

        case 'mixset':
            return {
                id,
                type: 'mixset',
                title: '',
                coverUrl: '',
                audioUrl: '',
                soundcloudEmbedUrl: '',
                tracklist: [],
                description: '',
                releaseDate: new Date().toISOString().split('T')[0],
                genre: '',
            } as MixsetComponent;

        case 'link':
            return {
                id,
                type: 'link',
                title: '',
                url: '',
                icon: 'globe',
            } as LinkComponent;
    }
}

/** @deprecated Use createEmptyEntry instead */
export const createEmptyComponent = createEmptyEntry;
