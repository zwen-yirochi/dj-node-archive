// components/EventCard.tsx
import type { EventComponent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

interface EventCardProps {
    event: EventComponent;
}

export default function EventCard({ event }: EventCardProps) {
    return (
        <Card className="overflow-hidden border-gray-400 bg-stone-300/50 backdrop-blur-sm transition-all hover:border-gray-700">
            <div className="flex flex-row">
                {/* 포스터 이미지 */}
                <div className="relative h-32 w-32 flex-shrink-0 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56">
                    <Image
                        src={event.posterUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>

                {/* 정보 영역 - 더 넓어짐 */}
                <CardContent className="flex flex-1 flex-col p-3 sm:p-4 md:p-6 lg:p-8">
                    {/* 제목 */}
                    <h3 className="mb-2 text-base font-bold tracking-wide text-primary transition-colors sm:text-lg md:text-xl lg:text-2xl">
                        {event.title}
                    </h3>

                    {/* 날짜 & 장소 뱃지 */}
                    <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2 md:mb-3">
                        <Badge
                            variant="outline"
                            className="border-gray-200/50 bg-stone-500/10 text-xs text-primary sm:text-xs"
                        >
                            <Calendar className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">
                                {new Date(event.date).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                            <span className="sm:hidden">
                                {new Date(event.date).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-gray-200/50 bg-stone-500/10 text-xs text-primary sm:text-xs"
                        >
                            <MapPin className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="max-w-[100px] truncate sm:max-w-none">
                                {event.venue}
                            </span>
                        </Badge>
                    </div>

                    {/* 라인업 */}
                    <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                        <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-500 sm:h-4 sm:w-4" />
                        <div className="flex-1 overflow-hidden">
                            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                                {event.lineup.map((artist, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="cursor-pointer bg-stone-500/10 text-[10px] text-primary transition-colors hover:bg-stone-600/20 sm:text-xs md:text-sm"
                                    >
                                        {artist}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
