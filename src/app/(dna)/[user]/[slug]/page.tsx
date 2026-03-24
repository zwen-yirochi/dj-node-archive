import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isSuccess } from '@/types/result';
import { getEntryDetailData } from '@/lib/services/user.service';
import {
    entryDetailConfig,
    type DetailableEntryType,
} from '@/components/dna/entry-detail/entry-detail.config';
import { EntryDetailShell } from '@/components/dna/EntryDetailShell';

interface PageProps {
    params: Promise<{ user: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { user, slug } = await params;
    const result = await getEntryDetailData(user, slug);

    if (!isSuccess(result)) {
        return { title: 'Not Found' };
    }

    const { entry, user: userData } = result.data;
    const config = entryDetailConfig[entry.type as DetailableEntryType];

    if (!config) {
        return { title: entry.title };
    }

    const meta = config.generateMeta(entry, userData);

    return {
        title: meta.title,
        description: meta.description,
        openGraph: {
            title: meta.title,
            description: meta.description,
            images: meta.images,
        },
    };
}

export const revalidate = 300;

export default async function EntryDetailPage({ params }: PageProps) {
    const { user, slug } = await params;
    const result = await getEntryDetailData(user, slug);

    if (!isSuccess(result)) {
        notFound();
    }

    const { entry, user: userData, username } = result.data;

    // link 타입은 상세 페이지 없음
    if (entry.type === 'link') {
        notFound();
    }

    return <EntryDetailShell entry={entry} user={userData} username={username} />;
}
