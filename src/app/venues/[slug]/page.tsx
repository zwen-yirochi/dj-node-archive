import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { findEventsByVenueId } from '@/lib/db/queries/event.queries';
import { findVenueBySlug } from '@/lib/db/queries/venue.queries';
import { isSuccess } from '@/types/result';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    ExternalLink,
    Globe,
    Instagram,
    MapPin,
    Music,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await findVenueBySlug(slug);

    if (!isSuccess(result)) {
        return { title: 'Venue Not Found' };
    }

    const venue = result.data;
    return {
        title: `${venue.name} - DJ Node Archive`,
        description: `${venue.name}의 이벤트 기록을 확인하세요. ${venue.city ? `위치: ${venue.city}` : ''}`,
    };
}

// Revalidate every 5 minutes for ISR
export const revalidate = 300;

export default async function VenuePage({ params }: PageProps) {
    const { slug } = await params;

    const venueResult = await findVenueBySlug(slug);

    if (!isSuccess(venueResult)) {
        notFound();
    }

    const venue = venueResult.data;
    const eventsResult = await findEventsByVenueId(venue.id, 500);
    const events = isSuccess(eventsResult) ? eventsResult.data : [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="font-display text-2xl tracking-wide">
                        DNA
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/discover">
                            <Button variant="ghost" size="sm">
                                Discovery
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

            {/* Back Link */}
            <div className="container mx-auto px-4 py-4">
                <Link
                    href="/discover"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Discovery로 돌아가기
                </Link>
            </div>

            {/* Venue Info */}
            <main className="container mx-auto px-4 pb-12">
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
                        {venue.source === 'ra_import' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                <Music className="h-3 w-3" />
                                Source: RA
                            </span>
                        )}
                    </div>

                    {/* Location */}
                    {(venue.city || venue.address) && (
                        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                                {venue.address || venue.city}
                                {venue.city && venue.country && `, ${venue.country}`}
                            </span>
                        </div>
                    )}

                    {/* Social Links */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {venue.instagram && (
                            <a
                                href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                            >
                                <Instagram className="h-4 w-4" />
                                {venue.instagram}
                            </a>
                        )}
                        {venue.website && (
                            <a
                                href={venue.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                            >
                                <Globe className="h-4 w-4" />
                                Website
                            </a>
                        )}
                        {venue.google_maps_url && (
                            <a
                                href={venue.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                            >
                                <MapPin className="h-4 w-4" />
                                Google Maps
                            </a>
                        )}
                        {venue.external_sources?.ra_url && (
                            <a
                                href={venue.external_sources.ra_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Resident Advisor
                            </a>
                        )}
                    </div>
                </div>

                {/* Events Section */}
                <section>
                    <h2 className="mb-4 text-xl font-semibold">
                        이벤트 기록
                        {events.length > 0 && (
                            <span className="ml-2 text-base font-normal text-muted-foreground">
                                ({events.length}개)
                            </span>
                        )}
                    </h2>

                    {events.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => {
                                const lineupText = getLineupText(event);
                                return (
                                    <Link key={event.id} href={`/event/${event.id}`}>
                                        <Card className="overflow-hidden transition-colors hover:bg-muted/50">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                        <Calendar className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium">
                                                            {event.title || formatDate(event.date)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatDate(event.date)}
                                                        </div>
                                                        {lineupText && (
                                                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                                {lineupText}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                아직 등록된 이벤트가 없습니다
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="mt-4">
                                    첫 번째 이벤트 등록하기
                                </Button>
                            </Link>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/** Import된 이벤트의 data.lineup_text 또는 lineup 배열에서 텍스트 추출 */
function getLineupText(event: { lineup: unknown; data: unknown }): string {
    // 1. Import된 이벤트: data.lineup_text 우선 사용 (더 풍부한 정보)
    const data = event.data as Record<string, unknown> | null;
    if (data?.lineup_text && typeof data.lineup_text === 'string') {
        return data.lineup_text;
    }

    // 2. lineup JSONB 배열에서 name 추출
    if (Array.isArray(event.lineup) && event.lineup.length > 0) {
        return event.lineup
            .map((a: { name?: string }) => a.name)
            .filter(Boolean)
            .join(', ');
    }

    return '';
}
