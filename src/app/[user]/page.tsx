'use client';

import { getUserProfile, separateComponentsByType } from '@/lib/supabase-queries';
import React, { useEffect, useState } from 'react';
import EventsSection from './components/EventsSection';
import GridView from './components/GridView';
import ProfileHeader from './components/ProfileHeader';
import ViewModeToggle from './components/ViewModeToggle';

interface PageProps {
    params: Promise<{ user: string }>;
}

export default function Page({ params }: PageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [mixsets, setMixsets] = useState<any[]>([]);

    const { user } = React.use(params);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            const profile = await getUserProfile(user);

            if (profile) {
                setUserData({
                    username: profile.username,
                    displayName: profile.display_name,
                    avatarUrl: profile.avatar_url,
                    bio: profile.bio,
                });

                // 페이지가 있고 컴포넌트가 있으면 분리
                if (profile.pages?.[0]?.components) {
                    const { events: fetchedEvents, mixsets: fetchedMixsets } =
                        separateComponentsByType(profile.pages[0].components);

                    setEvents(fetchedEvents);
                    setMixsets(fetchedMixsets);
                }
            }

            setLoading(false);
        }

        fetchData();
    }, [user]);
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-200">
                <p className="text-xl">로딩중...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-200">
                <p className="text-xl">사용자를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="text-primay min-h-screen bg-stone-200">
            <ProfileHeader {...userData} />
            {/* 뷰 모드 토글 */}
            <div className="mt-6 px-4">
                <div className="mx-auto mb-4 flex max-w-4xl justify-end">
                    <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
            </div>
            {viewMode === 'list' ? (
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
