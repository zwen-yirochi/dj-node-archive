import { Metadata } from 'next';
import Link from 'next/link';
import { getAllVenues } from '@/lib/db/queries/venue.queries';
import { CortexDiscoveryContent } from '@/components/discovery/CortexDiscoveryContent';
import { TopNav } from '@/components/cortex/TopNav';
import { PathBar } from '@/components/cortex/PathBar';
import { Footer } from '@/components/cortex/Footer';
import { Button } from '@/components/cortex/Button';
import { AsciiDivider } from '@/components/cortex/AsciiDivider';
import type { DBVenueSearchResult } from '@/types/database';

export const metadata: Metadata = {
    title: 'Discover - DJ Node Archive',
    description:
        '한국의 클럽과 베뉴를 탐색하세요. 서울, 부산 등 주요 도시의 음악 공연장을 찾아보세요.',
};

export const revalidate = 300;

export default async function DiscoverPage() {
    const result = await getAllVenues(50);
    const initialVenues: DBVenueSearchResult[] = result.success
        ? result.data.map((v) => ({ ...v, event_count: 0 }))
        : [];

    return (
        <div className="mx-auto max-w-cortex px-4 md:px-cortex-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover', active: true },
                ]}
            />

            <div className="hidden md:block">
                <PathBar path="root / discover" meta={`${initialVenues.length} nodes indexed`} />
            </div>

            <section className="pb-4 pt-8">
                <h1 className="mb-1.5 font-mono-alt text-[28px] font-bold uppercase leading-none tracking-cortex-tight md:text-[36px]">
                    Discovery
                </h1>
                <p className="text-cortex-body text-cortex-ink-mid">
                    한국의 클럽과 베뉴를 탐색하세요
                </p>
            </section>

            <CortexDiscoveryContent initialVenues={initialVenues} />

            <AsciiDivider />

            <section className="py-8 text-center">
                <p className="text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light">
                    DJ인가요?
                </p>
                <p className="mt-1 text-cortex-body text-cortex-ink-mid">
                    나만의 DJ 아카이브 페이지를 만들고 공연 기록을 관리하세요
                </p>
                <div className="mt-4">
                    <Link href="/login">
                        <Button>시작하기</Button>
                    </Link>
                </div>
            </section>

            <Footer
                meta={['DJ-NODE-ARCHIVE // MODULE: DISCOVERY']}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: 'KR',
                }}
            />
        </div>
    );
}
