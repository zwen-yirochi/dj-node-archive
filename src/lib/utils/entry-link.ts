import { isEventEntry, isPublicEventEntry, type ContentEntry } from '@/types/domain';

export function getEntryHref(entry: ContentEntry, username: string): string | null {
    // reference event → 위키 페이지
    if (isEventEntry(entry) && isPublicEventEntry(entry)) {
        return `/event/${entry.eventId}`;
    }
    // link → 외부 URL (상세 페이지 없음)
    if (entry.type === 'link') return null;
    // self-contained event, mixset, custom → slug 기반 상세
    if (entry.slug) {
        return `/${username}/${entry.slug}`;
    }
    return null;
}
