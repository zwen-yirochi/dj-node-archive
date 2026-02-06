// app/api/venues/route.ts
import { createVenue, getAllVenues } from '@/lib/db/queries/venue.queries';
import { createClient } from '@/lib/supabase/server';
import { isSuccess } from '@/types/result';
import { NextResponse } from 'next/server';

// 베뉴 이름을 slug로 변환하는 헬퍼 함수
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // 특수문자 제거
        .replace(/[\s_-]+/g, '-') // 공백, 언더스코어를 하이픈으로
        .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
}

export async function POST(request: Request) {
    try {
        // 인증 확인
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { name, city, country, address, instagram, website, google_maps_url } = body;

        // 필수 필드 검증
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: '베뉴 이름은 필수입니다.' }, { status: 400 });
        }

        // slug 생성 (중복 시 숫자 suffix 추가)
        let slug = generateSlug(name);
        let slugSuffix = 0;
        let finalSlug = slug;

        // slug 중복 체크 및 suffix 추가
        while (true) {
            const { data: existing } = await supabase
                .from('venue_references')
                .select('id')
                .eq('slug', finalSlug)
                .single();

            if (!existing) break;

            slugSuffix++;
            finalSlug = `${slug}-${slugSuffix}`;
        }

        const result = await createVenue({
            name: name.trim(),
            slug: finalSlug,
            city: city?.trim() || undefined,
            country: country?.trim() || undefined,
            address: address?.trim() || undefined,
            instagram: instagram?.trim() || undefined,
            website: website?.trim() || undefined,
            google_maps_url: google_maps_url?.trim() || undefined,
            claimed_by: user.id,
        });

        if (!isSuccess(result)) {
            if (result.error.code === 'CONFLICT') {
                return NextResponse.json({ error: result.error.message }, { status: 409 });
            }
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data }, { status: 201 });
    } catch (err) {
        console.error('POST /api/venues error:', err);
        return NextResponse.json({ error: '베뉴 생성 실패' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await getAllVenues(100);

        if (!isSuccess(result)) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: result.data });
    } catch (err) {
        console.error('GET /api/venues error:', err);
        return NextResponse.json({ error: '베뉴 목록 조회 실패' }, { status: 500 });
    }
}
