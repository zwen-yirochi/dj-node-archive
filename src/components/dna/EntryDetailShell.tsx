import type { ContentEntry, User } from '@/types/domain';

import { DnaPageShell } from './DnaPageShell';
import { entryDetailConfig, type DetailableEntryType } from './entry-detail/entry-detail.config';
import { NodeLabel } from './NodeLabel';

interface EntryDetailShellProps {
    entry: ContentEntry;
    user: User;
    username: string;
}

function getTypeLabel(type: string): string {
    if (type === 'event') return 'Event';
    if (type === 'mixset') return 'Mixset';
    return 'Custom';
}

export function EntryDetailShell({ entry, user, username }: EntryDetailShellProps) {
    const config = entryDetailConfig[entry.type as DetailableEntryType];
    if (!config) return null;

    return (
        <DnaPageShell
            pathBar={{
                items: [
                    { label: 'root', href: '/' },
                    { label: username, href: `/${username}` },
                    { label: entry.title },
                ],
                meta: `type: ${entry.type}`,
            }}
            footerMeta={[
                `DJ-NODE-ARCHIVE // ${getTypeLabel(entry.type).toUpperCase()}: ${entry.title.toUpperCase()}`,
            ]}
        >
            <section className="pb-6 pt-4">
                <NodeLabel right={getTypeLabel(entry.type)}>
                    {getTypeLabel(entry.type)} Node
                </NodeLabel>
                <h1 className="dna-heading-page md:mt-2">{entry.title}</h1>
            </section>

            {config.sections.map((section, i) => {
                const Component = section.component;
                return <Component key={i} entry={entry} />;
            })}
        </DnaPageShell>
    );
}
