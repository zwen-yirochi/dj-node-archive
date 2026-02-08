// app/dashboard/components/TreeSidebar/index.tsx (서버)
import { ContentEntry } from '@/types';
import Link from 'next/link';
import AccountSection from './AccountSection';
import TreeSidebarClient from './TreeSidebarClient';

interface TreeSidebarProps {
    entries: ContentEntry[];
    username: string;
    pageId: string;
}

export default function TreeSidebar({ entries, username, pageId }: TreeSidebarProps) {
    const events = entries
        .filter((e) => e.type === 'event')
        .sort((a, b) => a.position - b.position);

    const mixsets = entries
        .filter((e) => e.type === 'mixset')
        .sort((a, b) => a.position - b.position);

    const links = entries.filter((e) => e.type === 'link').sort((a, b) => a.position - b.position);

    const displayedEntries = entries
        .filter((e) => typeof e.displayOrder === 'number')
        .sort((a, b) => a.displayOrder! - b.displayOrder!);

    return (
        <aside className="flex h-full w-64 flex-col rounded-2xl bg-dashboard-bg-surface shadow-[0_-5px_10px_0_rgba(0,0,0,0.1),0_5px_10px_0_rgba(0,0,0,0.1)]">
            <div className="px-4 py-4">
                <Link href="/" className="font-display text-xl font-semibold text-dashboard-text">
                    DNA
                </Link>
            </div>

            <TreeSidebarClient
                initialEvents={events}
                initialMixsets={mixsets}
                initialLinks={links}
                initialDisplayedEntries={displayedEntries}
                username={username}
                pageId={pageId}
            />

            <AccountSection username={username} />
        </aside>
    );
}
