'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { InputField } from '@/components/dna/InputField';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { NodeItem } from '@/components/dna/NodeItem';
import QueryProvider from '@/components/providers/QueryProvider';
import { useEventSearch } from '@/hooks/use-search';

function EventSearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [page, setPage] = useState(1);

    const { data, isLoading } = useEventSearch(query, page);

    return (
        <DnaPageShell
            activeLink="discover"
            pathBar={{
                path: 'root / search / events',
                meta: data ? `${data.total_count} found` : '',
            }}
            footerMeta={['DJ-NODE-ARCHIVE // MODULE: SEARCH']}
        >
            <section className="pb-4 pt-8">
                <h1 className="mb-1.5 font-mono-alt text-[28px] font-bold uppercase leading-none tracking-dna-tight md:text-[36px]">
                    Events
                </h1>
                <p className="dna-text-body">이벤트 검색</p>
            </section>

            <InputField
                label="Search Events"
                placeholder="이벤트 제목, 아티스트 검색..."
                value={query}
                onChange={(v) => {
                    setQuery(v);
                    setPage(1);
                }}
            />

            {query.length >= 2 && (
                <>
                    <SectionLabel right={data ? `${data.total_count} FOUND` : ''}>
                        Results
                    </SectionLabel>

                    {isLoading ? (
                        <div className="dna-text-system py-12 text-center">// SCANNING...</div>
                    ) : !data || data.items.length === 0 ? (
                        <div className="py-12 text-center text-dna-body text-dna-ink-light">
                            // NO RESULTS FOUND
                        </div>
                    ) : (
                        <>
                            <div className="my-3">
                                {data.items.map((event, i) => (
                                    <NodeItem
                                        key={event.id}
                                        index={(page - 1) * data.limit + i + 1}
                                        type="EVT"
                                        name={event.title}
                                        detail={
                                            [event.date, event.venue_name]
                                                .filter(Boolean)
                                                .join(' · ') || '—'
                                        }
                                        href={event.url}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-center gap-4 py-6">
                                {page > 1 && (
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        className="dna-text-system text-dna-ink-light hover:text-dna-ink"
                                    >
                                        &larr; PREV
                                    </button>
                                )}
                                <span className="dna-text-system text-dna-ink-ghost">
                                    PAGE {page}
                                </span>
                                {data.has_next && (
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        className="dna-text-system text-dna-ink-light hover:text-dna-ink"
                                    >
                                        NEXT &rarr;
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </DnaPageShell>
    );
}

export default function EventSearchPage() {
    return (
        <QueryProvider>
            <Suspense>
                <EventSearchContent />
            </Suspense>
        </QueryProvider>
    );
}
