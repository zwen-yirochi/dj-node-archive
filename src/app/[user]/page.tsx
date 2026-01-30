'use client';

import type { EventComponent, MixsetComponent, User } from '@/types/domain';
import { useErrorToast } from '@/hooks/useErrorToast';
import { isSuccess, type AppError, type Result } from '@/types/result';
import React, { useEffect, useState } from 'react';

interface PageData {
    user: User;
    events: EventComponent[];
    mixsets: MixsetComponent[];
}
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

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-200">
                <p className="text-xl text-red-600">
                    {error.code === 'NOT_FOUND' ? '사용자를 찾을 수 없습니다.' : error.message}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-700"
                >
                    다시 시도
                </button>
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
