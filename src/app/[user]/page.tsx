import { getComponentsByType } from '@/lib/services/user.service';
import type { EventComponent, MixsetComponent, User } from '@/types/domain';
import EventsSection from './components/EventsSection';
import GridView from './components/GridView';
import ProfileHeader from './components/ProfileHeader';
import ViewModeToggle from './components/ViewModeToggle';
import NotFound from './not-found';

interface PageData {
    user: User;
    events: EventComponent[];
    mixsets: MixsetComponent[];
}

interface PageProps {
    params: Promise<{ user: string }>;
    searchParams: Promise<{ view?: 'list' | 'grid' }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { view = 'list' } = await searchParams;
    const { user } = await params;

    const result = await getComponentsByType(user);
    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            NotFound();
        }
        throw new Error(result.error.message);
    }
    const { events, mixsets } = result.data;
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-200">
                <p className="text-xl">로딩중...</p>
            </div>
        );
    }

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
