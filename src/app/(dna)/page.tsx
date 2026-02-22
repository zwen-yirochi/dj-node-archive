import { StatsRow } from '@/components/dna';
import { AsciiBox } from '@/components/dna/AsciiBox';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { getPlatformStats } from '@/lib/db/queries/stats.queries';
import Link from 'next/link';

export default async function LandingPage() {
    const statsResult = await getPlatformStats();
    const stats = statsResult.success ? statsResult.data : { events: 0, venues: 0, artists: 0 };

    return (
        <DnaPageShell footerMeta={['DJ-NODE-ARCHIVE // MODULE: LANDING']}>
            {/* ── Hero ── */}
            <section className="py-16 text-center md:py-24">
                <h1 className="dna-heading-hero">DJ Node Archive</h1>
                <p className="dna-text-body mx-auto mt-4 max-w-[520px] md:mt-6">
                    A gig archive built for DJs.
                    <br />
                    Document your history and connect with artists you&apos;ve shared the stage
                    with.
                </p>
            </section>

            {/* ── Stats ── */}
            <div className="px-5 md:px-7">
                <StatsRow
                    stats={[
                        { number: stats.events.toLocaleString(), label: 'Events' },
                        { number: stats.venues.toLocaleString(), label: 'Venues' },
                        { number: stats.artists.toLocaleString(), label: 'Artists' },
                    ]}
                    className="my-0 border-0"
                />
            </div>

            {/* ── Feature Cards ── */}
            <section className="my-10 grid gap-10">
                <Link href="/discover" className="group no-underline">
                    <AsciiBox className="my-0" repeat={80}>
                        <div className="dna-text-system mb-2">* DISCOVERY</div>
                        <h3 className="font-mono-alt text-base font-bold uppercase tracking-dna-tight">
                            Explore the Scene
                        </h3>
                        <p className="dna-text-body mt-2">
                            Search and browse venues, artists, and events across cities.
                        </p>
                        <span className="dna-text-system mt-4 inline-block border-b border-dna-ink-faint group-hover:border-dna-ink">
                            Explore →
                        </span>
                    </AsciiBox>
                </Link>

                <Link href="/login" className="group no-underline">
                    <AsciiBox className="my-0" repeat={80}>
                        <div className="dna-text-system mb-2">+ DASHBOARD</div>
                        <h3 className="font-mono-alt text-base font-bold uppercase tracking-dna-tight">
                            Your Archive
                        </h3>
                        <p className="dna-text-body mt-2">
                            Manage your gig history, build a timeline, and share it with a single
                            link.
                        </p>
                        <span className="dna-text-system mt-4 inline-block border-b border-dna-ink-faint group-hover:border-dna-ink">
                            Get Started →
                        </span>
                    </AsciiBox>
                </Link>
            </section>
        </DnaPageShell>
    );
}
