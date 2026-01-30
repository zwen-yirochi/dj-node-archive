import { getComponentsByType, getUser } from '@/lib/services/user.service';
import { notFound } from 'next/navigation';
import EventsSection from './components/EventsSection';
import GridView from './components/GridView';
import ProfileHeader from './components/ProfileHeader';
import ViewModeToggle from './components/ViewModeToggle';

interface PageProps {
    params: Promise<{ user: string }>;
    searchParams: Promise<{ view?: 'list' | 'grid' }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { view = 'list' } = await searchParams;
    const { user } = await params;

    const [userResult, componentsResult] = await Promise.all([
        getUser(user),
        getComponentsByType(user),
    ]);

    // 에러 체크
    if (!userResult.success) {
        if (userResult.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(userResult.error.message);
    }

    if (!componentsResult.success) {
        if (componentsResult.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(componentsResult.error.message);
    }

    const userData = userResult.data;
    const { events, mixsets } = componentsResult.data;

    return (
        <div className="text-primay min-h-screen bg-stone-200">
            <ProfileHeader {...userData} />
            {/* 뷰 모드 토글 */}
            <div className="mt-6 px-4">
                <div className="mx-auto mb-4 flex max-w-4xl justify-end">
                    <ViewModeToggle viewMode={view} />
                </div>
            </div>
            {view === 'list' ? (
                <>
                    <EventsSection events={events} />
                    {/* 믹스셋 섹션도 나중에 추가 */}
                </>
            ) : (
                <GridView events={events} mixsets={mixsets} />
            )}
        </div>
    );
}
