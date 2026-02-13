import { getPublicPageData } from '@/lib/services/user.service';
import { notFound } from 'next/navigation';
import UserPageContent from './components/UserPageContent';

interface PageProps {
    params: Promise<{ user: string }>;
}

export default async function Page({ params }: PageProps) {
    const { user } = await params;
    const result = await getPublicPageData(user);

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    const { user: userData, components } = result.data;

    return <UserPageContent user={userData} entries={components} />;
}
