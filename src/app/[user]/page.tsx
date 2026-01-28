'use client';

import { events, mixsets, userData } from '@/mock/mockData';
import React, { useState } from 'react';
import EventsSection from './components/EventsSection';
import GridView from './components/GridView';
import ProfileHeader from './components/ProfileHeader';
import ViewModeToggle from './components/ViewModeToggle';

interface PageProps {
    params: Promise<{ user: string }>;
}

export default function Page({ params }: PageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // params를 unwrap하기 위해 use hook 사용
    const { user } = React.use(params);

    return (
        <div className="min-h-screen bg-stone-200 text-[rgba(66,52,60)]">
            <ProfileHeader {...userData} />

            {/* 뷰 모드 토글 */}
            <div className="mt-12 px-6">
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
