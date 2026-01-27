import Image from 'next/image';

interface EventData {
    id: string;
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    description: string;
    lineup: string[];
}

interface EventCardProps {
    event: EventData;
}

export default function EventCard({ event }: EventCardProps) {
    return (
        <article className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-all hover:border-gray-700">
            <div className="flex flex-col lg:flex-row">
                {/* 포스터 */}
                <div className="relative h-48 w-full flex-shrink-0 lg:h-auto lg:w-72">
                    <Image
                        src={event.posterUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>

                {/* 정보 */}
                <div className="flex-1 p-6 md:p-8">
                    {/* 날짜 & 장소 */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-2 text-sm text-pink-500">
                            <svg
                                className="h-4 w-4"
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
                        </span>
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                            <svg
                                className="h-4 w-4"
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
                        </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="mb-4 text-3xl font-bold tracking-wide text-white transition-colors hover:text-pink-500 md:text-4xl">
                        {event.title}
                    </h3>

                    {/* 설명 */}
                    <p className="mb-6 leading-relaxed text-gray-400">{event.description}</p>

                    {/* 라인업 */}
                    <div className="flex items-start gap-3">
                        <svg
                            className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500"
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
                        <div className="text-sm">
                            <span className="mb-1 block text-gray-500">라인업</span>
                            <div className="text-white">
                                {event.lineup.map((artist, i) => (
                                    <span key={i}>
                                        <span className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                                            {artist}
                                        </span>
                                        {i < event.lineup.length - 1 && (
                                            <span className="text-gray-500">, </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
