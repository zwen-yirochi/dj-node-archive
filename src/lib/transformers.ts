import type { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import type { DBEventWithVenue } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * DB 이벤트 데이터를 EventComponent로 변환
 */
export function eventToComponent(event: DBEventWithVenue): EventComponent {
    return {
        id: uuidv4(),
        type: 'event',
        title: event.title || '',
        date: event.date,
        venue: event.venue?.name || '',
        posterUrl: event.data?.poster_url || '',
        lineup: event.data?.lineup_text?.split('\n').filter(Boolean) || [],
        description: event.data?.notes || '',
        links: event.data?.set_recording_url
            ? [{ title: '세트 녹음', url: event.data.set_recording_url }]
            : [],
    };
}

/**
 * 빈 컴포넌트 템플릿 생성
 */
export function createEmptyComponent(type: 'event' | 'mixset' | 'link'): ComponentData {
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
