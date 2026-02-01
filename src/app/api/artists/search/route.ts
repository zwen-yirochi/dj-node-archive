// app/api/artists/search/route.ts
import { searchArtists, searchPlatformUsers } from '@/lib/db/queries/artist.queries';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all' | 'user' | 'artist'

    if (query.length < 2) {
        return NextResponse.json({ users: [], artists: [] });
    }

    const results: {
        users: Array<{ id: string; username: string; display_name?: string; avatar_url?: string }>;
        artists: Array<{ id: string; name: string; instagram?: string }>;
    } = {
        users: [],
        artists: [],
    };

    // 플랫폼 유저 검색
    if (type === 'all' || type === 'user') {
        const usersResult = await searchPlatformUsers(query);
        if (usersResult.success) {
            results.users = usersResult.data;
        }
    }

    // 아티스트 레퍼런스 검색
    if (type === 'all' || type === 'artist') {
        const artistsResult = await searchArtists(query);
        if (artistsResult.success) {
            results.artists = artistsResult.data.map((a) => ({
                id: a.id,
                name: a.name,
                instagram: a.instagram,
            }));
        }
    }

    return NextResponse.json(results);
}
