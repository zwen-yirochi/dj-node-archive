/**
 * Dashboard Search Services
 *
 * API 검색 함수들을 제공합니다.
 */

import type { SearchOption } from '@/components/ui/SearchableInput';
import type { TagOption } from '@/components/ui/TagSearchInput';

// ============================================
// Venue Search
// ============================================

export async function searchVenues(query: string): Promise<SearchOption[]> {
    try {
        const res = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}&limit=10`);
        if (!res.ok) return [];
        const json = await res.json();
        const venues = json.data || [];
        return venues.map((v: { id: string; name: string; city?: string }) => ({
            id: v.id,
            name: v.name,
            subtitle: v.city || undefined,
        }));
    } catch {
        return [];
    }
}

// ============================================
// Artist Search
// ============================================

export async function searchArtists(query: string): Promise<TagOption[]> {
    try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(query)}&type=all`);
        if (!res.ok) return [];
        const data = await res.json();
        const results: TagOption[] = [];

        if (data.users) {
            results.push(
                ...data.users.map((u: { id: string; display_name: string; username: string }) => ({
                    id: u.id,
                    name: u.display_name || u.username,
                    subtitle: 'Platform user',
                }))
            );
        }

        if (data.artists) {
            results.push(
                ...data.artists.map((a: { id: string; name: string }) => ({
                    id: a.id,
                    name: a.name,
                    subtitle: 'Artist reference',
                }))
            );
        }

        return results;
    } catch {
        return [];
    }
}
