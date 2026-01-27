'use client';

import React, { useState } from 'react';
import EventsSection from './components/EventsSection';
import GridView from './components/GridView';
import ProfileHeader from './components/ProfileHeader';

interface PageProps {
    params: Promise<{ user: string }>;
}

export default function Page({ params }: PageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // params를 unwrap하기 위해 use hook 사용
    const { user } = React.use(params);

    // 임시 사용자 데이터
    const userData = {
        username: user,
        displayName: user.toUpperCase(),
        bio: 'DJ & Producer based in Seoul',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
    };

    // 임시 공연 데이터
    const events = [
        {
            id: '1',
            title: 'NIGHT SESSION',
            date: '2024-12-31',
            venue: 'Club Octagon',
            posterUrl: 'https://picsum.photos/seed/show1/800/600',
            description: '연말을 마무리하는 특별한 밤',
            lineup: ['@dj1', '@dj2', '@dj3'],
        },
        {
            id: '2',
            title: 'WAREHOUSE PARTY',
            date: '2024-11-15',
            venue: 'Secret Location',
            posterUrl: 'https://picsum.photos/seed/show2/800/600',
            description: '언더그라운드 테크노 파티',
            lineup: ['@producer1', '@dj4'],
        },
        {
            id: '3',
            title: 'SUMMER FESTIVAL',
            date: '2024-08-20',
            venue: 'Beach Club',
            posterUrl: 'https://picsum.photos/seed/show3/800/600',
            description: '여름 페스티벌',
            lineup: ['@dj5', '@dj6'],
        },
    ];

    // 임시 믹스셋 데이터
    const mixsets = [
        {
            id: '1',
            title: 'Winter Mix 2024',
            releaseDate: '2024-12-01',
            genre: 'House',
            coverUrl: 'https://picsum.photos/seed/mix1/600/600',
            description: '겨울을 위한 따뜻한 하우스 믹스',
        },
        {
            id: '2',
            title: 'Techno Essentials',
            releaseDate: '2024-11-20',
            genre: 'Techno',
            coverUrl: 'https://picsum.photos/seed/mix2/600/600',
            description: '순수 테크노 사운드',
        },
    ];

    return (
        <div className="min-h-screen bg-stone-200 text-[rgba(66,52,60)]">
            <ProfileHeader {...userData} />

            {/* 뷰 모드 토글 - 페이지 레벨 */}
            <div className="mt-12 px-6">
                <div className="mx-auto mb-4 flex max-w-4xl justify-end">
                    <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-md px-4 py-2 transition-all ${
                                viewMode === 'list'
                                    ? 'bg-pink-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="리스트 뷰"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md px-4 py-2 transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-pink-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="그리드 뷰"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                />
                            </svg>
                        </button>
                    </div>
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
