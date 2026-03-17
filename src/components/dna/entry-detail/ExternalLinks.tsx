import type { ExternalLink } from '@/types/domain';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { SectionLabel } from '@/components/dna/SectionLabel';

interface ExternalLinksProps {
    links: ExternalLink[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
    if (!links || links.length === 0) return null;

    return (
        <>
            <AsciiDivider text="LINKS" />
            <section className="my-5">
                <SectionLabel right={`${links.length} LINKS`}>External Links</SectionLabel>
                <div className="my-3 flex flex-col gap-2">
                    {links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between border border-dna-ink-faint px-4 py-3 text-dna-meta-val uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink-light hover:text-dna-ink"
                        >
                            <span>{link.title}</span>
                            <span className="text-dna-ink-ghost">&rarr;</span>
                        </a>
                    ))}
                </div>
            </section>
        </>
    );
}
