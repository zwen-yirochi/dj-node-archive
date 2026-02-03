import { getPublicPageData } from '@/lib/services/user.service';
import type { EventComponent, MixsetComponent } from '@/types/domain';
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

    const result = await getPublicPageData(user);

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    const { user: userData, components } = result.data;

    // 컴포넌트를 타입별로 분류
    const events = components.filter((c): c is EventComponent => c.type === 'show');
    const mixsets = components.filter((c): c is MixsetComponent => c.type === 'mixset');

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
