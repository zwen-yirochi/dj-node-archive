import type { ContentEntry, User } from '@/types/domain';
import { Crosshair, ScanLine, SectionMarker } from './Decorations';
import EntryCard from './EntryCard';
import ProfileHeader from './ProfileHeader';
import ShareButton from './ShareButton';

interface Props {
    user: User;
    entries: ContentEntry[];
}

export default function UserPageContent({ user, entries }: Props) {
    const groups: ContentEntry[][] = [];
    for (let i = 0; i < entries.length; i += 3) {
        groups.push(entries.slice(i, i + 3));
    }

    return (
        <div className="flex min-h-screen justify-center bg-[#d6d3ce]">
            <div className="relative min-h-screen w-full max-w-[390px] animate-fade-in overflow-x-hidden bg-[#f0ede8] font-mono text-[#1a1a1a]">
                <div className="flex justify-end px-4 pt-4">
                    <ShareButton />
                </div>
                <ProfileHeader {...user} />
                <div className="grid grid-cols-[40px_1fr] px-4">
                    <aside className="border-black/8 relative border-r">
                        {groups.map((_, gi) => (
                            <SectionMarker
                                key={gi}
                                number={String(gi + 1).padStart(2, '0')}
                                offset={gi}
                            />
                        ))}
                    </aside>
                    <main className="min-w-0">
                        {groups.map((group, gi) => (
                            <section key={gi}>
                                <ScanLine delay={gi * 0.3} />
                                {group.map((entry, ei) => (
                                    <EntryCard key={entry.id} entry={entry} index={gi * 3 + ei} />
                                ))}
                                <Crosshair position={gi % 2 === 0 ? 'right' : 'center'} />
                            </section>
                        ))}
                        <div className="h-12" />
                    </main>
                </div>
            </div>
        </div>
    );
}
