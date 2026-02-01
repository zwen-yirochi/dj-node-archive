import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAllVenues } from '@/lib/db/queries/venue.queries';
import { DiscoveryContent } from '@/components/discovery/DiscoveryContent';
import { Button } from '@/components/ui/button';
import type { DBVenueSearchResult } from '@/types/database';

export const metadata: Metadata = {
    title: 'Discover - DJ Node Archive',
    description:
        '한국의 클럽과 베뉴를 탐색하세요. 서울, 부산 등 주요 도시의 음악 공연장을 찾아보세요.',
};

// Revalidate every 5 minutes for ISR
export const revalidate = 300;

export default async function DiscoverPage() {
    const result = await getAllVenues(50);
    const initialVenues: DBVenueSearchResult[] = result.success
        ? result.data.map((v) => ({ ...v, event_count: 0 }))
        : [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="font-display text-2xl tracking-wide">
                        DNA
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                로그인
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="sm">
                                시작하기
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Discovery</h1>
                    <p className="mt-2 text-muted-foreground">한국의 클럽과 베뉴를 탐색하세요</p>
                </div>

                <DiscoveryContent initialVenues={initialVenues} />
            </main>

            {/* CTA */}
            <section className="border-t bg-muted/50 py-12">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold">DJ인가요?</h2>
                    <p className="mt-2 text-muted-foreground">
                        나만의 DJ 아카이브 페이지를 만들고 공연 기록을 관리하세요
                    </p>
                    <Link href="/login">
                        <Button className="mt-4" size="lg">
                            무료로 시작하기
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
