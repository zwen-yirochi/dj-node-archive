// app/api/artists/route.ts
import { createArtist } from '@/lib/db/queries/artist.queries';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, slug, instagram, soundcloud } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: '아티스트 이름이 필요합니다' }, { status: 400 });
        }

        const result = await createArtist({
            name: name.trim(),
            slug: slug,
            instagram: instagram?.trim(),
            soundcloud: soundcloud?.trim(),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ data: result.data });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
