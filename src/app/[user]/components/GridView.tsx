'use client';
// components/UnifiedGridView.tsx
import type { EventEntry, MixsetEntry } from '@/types';
import Masonry from 'react-masonry-css';
import EventGridCard from './EventGridCard';

interface GridViewProps {
    events: EventEntry[];
    mixsets: MixsetEntry[];
}

type UnifiedItem = { type: 'event'; data: EventEntry; date: string };

export default function GridView({ events, mixsets }: GridViewProps) {
    // 데이터 준비 (동일)
    const allItems: UnifiedItem[] = [
        ...events.map((event) => ({
            type: 'event' as const,
            data: event,
            date: event.date,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const breakpointColumns = {
        default: 4,
        1536: 4,
        1280: 3,
        1024: 3,
        768: 2,
        640: 1,
    };

    return (
        <div className="mt-12 px-6">
            <div className="mx-auto max-w-7xl">
                {/* 헤더 동일 */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-stone-500/20">
                        <svg
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                    <h2 className="text-shadow-custom text-3xl font-bold tracking-wider md:text-4xl">
                        ALL CONTENT
                    </h2>
                    <span className="text-sm text-gray-500">({allItems.length})</span>
                </div>

                {/* Masonry Grid */}
                <Masonry
                    breakpointCols={breakpointColumns}
                    className="-ml-6 flex w-auto"
                    columnClassName="pl-6 bg-clip-padding"
                >
                    {allItems.map((item) => (
                        <div key={`${item.type}-${item.data.id}`} className="mb-6">
                            <EventGridCard event={item.data} />
                        </div>
                    ))}
                </Masonry>
            </div>
        </div>
    );
}
