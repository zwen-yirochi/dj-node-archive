import { notFound } from 'next/navigation';

import { isSuccess } from '@/types/result';
import { getEntryById } from '@/lib/db/queries/entry.queries';
import { mapEntryToDomain } from '@/lib/mappers';
import { DnaPageShell } from '@/components/dna/DnaPageShell';

interface PageProps {
    params: Promise<{ user: string; entryId: string }>;
}

export default async function EntryDetailPage({ params }: PageProps) {
    const { user, entryId } = await params;
    const result = await getEntryById(entryId);

    if (!isSuccess(result)) {
        notFound();
    }

    const entry = mapEntryToDomain(result.data);

    return (
        <DnaPageShell
            pathBar={{ path: `/${user}/${entry.type}`, meta: entry.title }}
            footerMeta={[entry.type]}
        >
            <div className="flex flex-col gap-4 py-8">
                <h1 className="text-lg font-semibold">{entry.title}</h1>
                <p className="text-sm text-neutral-500">Entry detail page — coming soon</p>
            </div>
        </DnaPageShell>
    );
}
