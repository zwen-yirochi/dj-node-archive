// lib/mappers/user.mapper.ts
// 서버/클라이언트 공용 - 순수 함수
import type { DBComponent, DBUser } from '@/types/database';
import type {
    ContentEntry,
    EventComponent,
    LinkComponent,
    MixsetComponent,
    User,
} from '@/types/domain';

export function mapUserToDomain(dbUser: DBUser): User {
    return {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.display_name || dbUser.username,
        avatarUrl: dbUser.avatar_url || '/default-avatar.png',
        bio: dbUser.bio || '',
    };
}

export function mapUserToDatabase(user: Partial<User>): Partial<DBUser> {
    return {
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        bio: user.bio,
    };
}

export function mapEntryToDomain(dbComp: DBComponent): ContentEntry {
    const baseId = { id: dbComp.id };

    switch (dbComp.type) {
        case 'event': {
            const data = dbComp.data as Record<string, any>;
            return {
                ...baseId,
                type: 'event',
                title: data.title || '',
                date: data.date || '',
                venue: data.venue || '',
                posterUrl: data.posterUrl || '',
                lineup: data.lineup || [],
                description: data.description || '',
                links: data.links,
            } as EventComponent;
        }

        case 'mixset': {
            const data = dbComp.data as Record<string, any>;
            return {
                ...baseId,
                type: 'mixset',
                title: data.title || '',
                coverUrl: data.coverUrl || '',
                audioUrl: data.audioUrl || '',
                soundcloudEmbedUrl: data.soundcloudEmbedUrl,
                tracklist: data.tracklist || [],
                description: data.description || '',
                releaseDate: data.releaseDate || '',
                genre: data.genre || '',
            } as MixsetComponent;
        }

        case 'link': {
            const data = dbComp.data as Record<string, any>;
            return {
                ...baseId,
                type: 'link',
                title: data.title || '',
                url: data.url || '',
                icon: data.icon || 'globe',
            } as LinkComponent;
        }

        default:
            throw new Error(`Unknown component type: ${(dbComp as any).type}`);
    }
}

export function mapEntryToDatabase(
    entry: ContentEntry,
    position: number
): Omit<DBComponent, 'id' | 'created_at' | 'updated_at' | 'page_id'> {
    const { id, type, ...data } = entry;

    return {
        type,
        position,
        data,
    };
}

/** @deprecated Use mapEntryToDomain instead */
export const mapComponentToDomain = mapEntryToDomain;

/** @deprecated Use mapEntryToDatabase instead */
export const mapComponentToDatabase = mapEntryToDatabase;
