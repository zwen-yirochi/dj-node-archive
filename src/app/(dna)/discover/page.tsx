import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { Metadata } from 'next';
import { DnaDiscoveryContent } from './DnaDiscoveryContent';

export const metadata: Metadata = {
    title: 'Discover - DJ Node Archive',
    description: 'Search and discover artists, venues, and events in the Korean DJ scene.',
};

export default function DiscoverPage() {
    return (
        <DnaPageShell
            activeLink="discover"
            pathBar={{ path: 'root / discovery' }}
            footerMeta={['DJ-NODE-ARCHIVE // MODULE: DISCOVERY']}
        >
            <section className="pb-4 pt-8">
                <h1 className="mb-1.5 font-mono-alt text-[28px] font-bold uppercase leading-none tracking-dna-tight md:text-[36px]">
                    Discovery
                </h1>
            </section>

            <DnaDiscoveryContent />
        </DnaPageShell>
    );
}
