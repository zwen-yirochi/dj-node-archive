import {
    isEventEntry,
    type HeaderStyle,
    type ProfileLink,
    type ResolvedSection,
    type User,
} from '@/types/domain';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { headerRenderers } from '@/components/dna/headers';
import { MetaTable } from '@/components/dna/MetaTable';
import { SectionLabel } from '@/components/dna/SectionLabel';
import ShareButton from '@/components/dna/ShareButton';
import { StatsRow } from '@/components/dna/StatsRow';

import { SectionRenderer } from './SectionRenderer';

const PLATFORM_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    bandcamp: 'Bandcamp',
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    soundcloud: 'SoundCloud',
};

interface Props {
    user: User;
    sections: ResolvedSection[];
    headerStyle?: HeaderStyle;
    links?: ProfileLink[];
}

export default function UserPageContent({
    user,
    sections,
    headerStyle = 'minimal',
    links = [],
}: Props) {
    const allEntries = sections.flatMap((s) => s.entries);
    const eventEntries = allEntries.filter(isEventEntry);
    const uniqueVenues = new Set(eventEntries.map((e) => e.venue?.name).filter(Boolean));

    const HeaderComponent = headerRenderers[headerStyle];

    const activeLinks = links
        .filter((l) => l.url && l.enabled !== false)
        .map((l) => ({
            label: l.type === 'custom' ? l.label || 'Link' : (PLATFORM_LABELS[l.type] ?? l.type),
            href: l.url,
        }));

    return (
        <DnaPageShell
            pathBar={{
                items: [{ label: 'root', href: '/' }, { label: user.username }],
                meta: 'node type: artist // status: active',
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // NODE: ${user.username.toUpperCase()}`]}
        >
            <div className="relative">
                <HeaderComponent user={user} entries={allEntries} links={links} />
                <div className="absolute right-0 top-6 md:top-8">
                    <ShareButton />
                </div>
            </div>

            <div className="hidden md:block">
                <StatsRow
                    stats={[
                        { number: String(eventEntries.length), label: 'Events' },
                        { number: String(uniqueVenues.size), label: 'Venues' },
                        { number: String(allEntries.length - eventEntries.length), label: 'Other' },
                        { number: String(allEntries.length), label: 'Total' },
                    ]}
                />
            </div>

            <div className="hidden gap-dna-gap md:grid md:grid-cols-2">
                <div>
                    <SectionLabel right="META">Node Info</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Entries', value: String(allEntries.length) },
                            ...(activeLinks.length > 0
                                ? [
                                      {
                                          key: 'Links',
                                          values: activeLinks.map((l) => ({
                                              text: l.label,
                                              href: l.href,
                                          })),
                                      },
                                  ]
                                : []),
                            { key: 'Status', value: 'ACTIVE' },
                        ]}
                    />
                </div>
                <div className="hidden md:block">
                    <SectionLabel right="SYS">Archive Status</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Events', value: String(eventEntries.length) },
                            { key: 'Venues', value: String(uniqueVenues.size) },
                            {
                                key: 'Mixsets',
                                value: String(allEntries.filter((e) => e.type === 'mixset').length),
                            },
                            {
                                key: 'Links',
                                value: String(allEntries.filter((e) => e.type === 'link').length),
                            },
                        ]}
                    />
                </div>
            </div>

            {sections.map((section) => (
                <SectionRenderer key={section.id} section={section} username={user.username} />
            ))}
        </DnaPageShell>
    );
}
