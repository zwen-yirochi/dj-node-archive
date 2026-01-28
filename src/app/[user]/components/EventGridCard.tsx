'use client';

import { EventData } from '@/app/types';
import Image from 'next/image';
import { useState } from 'react';

interface EventGridCardProps {
    event: EventData;
}

export default function EventGridCard({ event }: EventGridCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="relative w-full cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div
                className={`preserve-3d relative w-full transition-transform duration-500 ${
                    isFlipped ? 'rotate-y-180' : ''
                }`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* 앞면 - 이미지만 */}
                <div
                    className="backface-hidden relative w-full"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <article className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-all hover:border-pink-500">
                        <div className="relative aspect-[4/5] overflow-hidden">
                            <Image
                                src={event.posterUrl}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                unoptimized
                            />

                            {/* 타입 배지 */}
                            <div className="absolute right-3 top-3 rounded bg-pink-500 px-2 py-1 text-xs font-bold text-white">
                                EVENT
                            </div>

                            {/* 날짜 배지 */}
                            <div className="absolute left-3 top-3 rounded-lg bg-black/80 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                                {new Date(event.date).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </div>

                            {/* 클릭 힌트 */}
                            <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                클릭하여 상세보기
                            </div>
                        </div>
                        {/* 정보 */}
                        <div className="p-4">
                            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-pink-500">
                                {event.title}
                            </h3>

                            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                                <svg
                                    className="h-4 w-4 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span className="line-clamp-1">{event.venue}</span>
                            </div>

                            <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                                {event.description}
                            </p>

                            {/* 라인업 태그 */}
                            <div className="flex flex-wrap gap-1.5">
                                {event.lineup.slice(0, 3).map((artist, i) => (
                                    <span
                                        key={i}
                                        className="cursor-pointer rounded bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400 transition-colors hover:bg-cyan-500/20"
                                    >
                                        {artist}
                                    </span>
                                ))}
                                {event.lineup.length > 3 && (
                                    <span className="px-2 py-1 text-xs text-gray-500">
                                        +{event.lineup.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    </article>
                </div>

                {/* 뒷면 - 상세 정보 */}
                <div
                    className="backface-hidden absolute inset-0 w-full"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <article className="h-full overflow-hidden rounded-xl border border-pink-500 bg-gray-900/95 backdrop-blur-sm">
                        <div className="flex h-full flex-col p-6">
                            {/* 제목 */}
                            <h3 className="mb-4 text-2xl font-bold text-pink-500">{event.title}</h3>

                            {/* 날짜 & 장소 */}
                            <div className="mb-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <svg
                                        className="h-4 w-4 flex-shrink-0 text-pink-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {new Date(event.date).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <svg
                                        className="h-4 w-4 flex-shrink-0 text-pink-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    {event.venue}
                                </div>
                            </div>

                            {/* 설명 */}
                            <p className="mb-4 flex-1 overflow-y-auto text-sm leading-relaxed text-gray-400">
                                {event.description}
                            </p>

                            {/* 라인업 */}
                            <div className="border-t border-gray-800 pt-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <svg
                                        className="h-4 w-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                        />
                                    </svg>
                                    <span className="text-xs font-semibold uppercase text-gray-500">
                                        라인업
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {event.lineup.map((artist, i) => (
                                        <span
                                            key={i}
                                            className="rounded bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400 transition-colors hover:bg-cyan-500/20"
                                        >
                                            {artist}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 뒤로 돌리기 힌트 */}
                            <div className="mt-4 text-center text-xs text-gray-500">
                                클릭하여 돌아가기
                            </div>
                        </div>
                    </article>
                </div>
            </div>

            {/* 추가 CSS */}
            <style jsx>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
}
