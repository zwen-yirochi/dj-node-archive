'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VenueSelector } from '@/components/venue/VenueSelector';
import { ArtistTagger, TaggedArtist } from '@/components/artist/ArtistTagger';
import type { DBVenueSearchResult, DBEvent, DBEventLineupItem } from '@/types/database';

export interface EventFormData {
    venue: {
        venue_id?: string;
        name: string;
    };
    title?: string;
    date: string;
    lineup: DBEventLineupItem[];
    data: {
        poster_url?: string;
        description?: string;
        links?: { title: string; url: string }[];
    };
}

export interface EventFormProps {
    initialData?: Partial<EventFormData>;
    initialVenue?: DBVenueSearchResult | null;
    initialPerformers?: TaggedArtist[];
    onSubmit: (data: EventFormData) => Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export function EventForm({
    initialData,
    initialVenue,
    initialPerformers,
    onSubmit,
    onCancel,
    submitLabel = '저장',
    isSubmitting = false,
}: EventFormProps) {
    const [venue, setVenue] = useState<DBVenueSearchResult | null>(initialVenue || null);
    const [title, setTitle] = useState(initialData?.title || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [posterUrl, setPosterUrl] = useState(initialData?.data?.poster_url || '');
    const [description, setDescription] = useState(initialData?.data?.description || '');
    const [performers, setPerformers] = useState<TaggedArtist[]>(initialPerformers || []);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!venue) {
            setError('베뉴를 선택해주세요.');
            return;
        }

        if (!date) {
            setError('날짜를 입력해주세요.');
            return;
        }

        try {
            // Convert performers to lineup format
            const lineup: DBEventLineupItem[] = performers.map((p) => ({
                artist_id: p.type === 'artist' ? p.id : undefined,
                name: p.name,
            }));

            await onSubmit({
                venue: {
                    venue_id: venue.id,
                    name: venue.name,
                },
                title: title.trim() || undefined,
                date,
                lineup,
                data: {
                    poster_url: posterUrl.trim() || undefined,
                    description: description.trim() || undefined,
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* 베뉴 선택 */}
            <div className="space-y-2">
                <Label>
                    베뉴 <span className="text-destructive">*</span>
                </Label>
                <VenueSelector
                    value={venue}
                    onChange={setVenue}
                    allowCreate
                    placeholder="베뉴를 검색하세요"
                />
            </div>

            {/* 날짜 */}
            <div className="space-y-2">
                <Label htmlFor="date">
                    날짜 <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>

            {/* 이벤트 제목 (선택) */}
            <div className="space-y-2">
                <Label htmlFor="title">이벤트 제목 (선택)</Label>
                <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: Cakeshop 5th Anniversary"
                />
            </div>

            {/* 포스터 URL (선택) */}
            <div className="space-y-2">
                <Label htmlFor="poster_url">포스터 이미지 URL (선택)</Label>
                <Input
                    id="poster_url"
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://"
                />
            </div>

            {/* 라인업 - 아티스트 태깅 */}
            <div className="space-y-2">
                <Label>라인업 (선택)</Label>
                <ArtistTagger
                    value={performers}
                    onChange={setPerformers}
                    placeholder="아티스트 검색 또는 추가..."
                />
                <p className="text-xs text-muted-foreground">
                    플랫폼 유저를 태그하거나 새 아티스트를 추가할 수 있습니다
                </p>
            </div>

            {/* 설명 (선택) */}
            <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="이벤트에 대한 설명"
                    rows={3}
                />
            </div>

            {/* 에러 메시지 */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        취소
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

// 기존 이벤트를 폼 데이터로 변환하는 헬퍼
export function eventToFormData(event: DBEvent): {
    initialData: Partial<EventFormData>;
    initialVenue: DBVenueSearchResult | null;
    initialPerformers: TaggedArtist[];
} {
    // Convert lineup to TaggedArtist format
    // Note: entries without artist_id are treated as artist type with temporary id
    const performers: TaggedArtist[] = (event.lineup || []).map((item, index) => ({
        id: item.artist_id || `temp-${index}`,
        name: item.name,
        type: 'artist' as const,
    }));

    return {
        initialData: {
            venue: event.venue,
            title: event.title || '',
            date: event.date,
            lineup: event.lineup || [],
            data: event.data || {},
        },
        initialVenue: event.venue?.venue_id
            ? {
                  id: event.venue.venue_id,
                  name: event.venue.name,
                  slug: '', // Will be filled by actual lookup if needed
              }
            : null,
        initialPerformers: performers,
    };
}
