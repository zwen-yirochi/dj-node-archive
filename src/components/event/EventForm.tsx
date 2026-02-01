'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VenueSelector } from '@/components/venue/VenueSelector';
import type { DBVenueSearchResult, DBEventWithVenue } from '@/types/database';

export interface EventFormData {
    venue_ref_id: string;
    venue?: DBVenueSearchResult | null;
    title?: string;
    date: string;
    data?: {
        poster_url?: string;
        notes?: string;
        set_recording_url?: string;
        lineup_text?: string;
    };
}

export interface EventFormProps {
    initialData?: Partial<EventFormData>;
    initialVenue?: DBVenueSearchResult | null;
    onSubmit: (data: EventFormData) => Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export function EventForm({
    initialData,
    initialVenue,
    onSubmit,
    onCancel,
    submitLabel = '저장',
    isSubmitting = false,
}: EventFormProps) {
    const [venue, setVenue] = useState<DBVenueSearchResult | null>(initialVenue || null);
    const [title, setTitle] = useState(initialData?.title || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [posterUrl, setPosterUrl] = useState(initialData?.data?.poster_url || '');
    const [notes, setNotes] = useState(initialData?.data?.notes || '');
    const [setRecordingUrl, setSetRecordingUrl] = useState(
        initialData?.data?.set_recording_url || ''
    );
    const [lineupText, setLineupText] = useState(initialData?.data?.lineup_text || '');
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
            await onSubmit({
                venue_ref_id: venue.id,
                venue,
                title: title.trim() || undefined,
                date,
                data: {
                    poster_url: posterUrl.trim() || undefined,
                    notes: notes.trim() || undefined,
                    set_recording_url: setRecordingUrl.trim() || undefined,
                    lineup_text: lineupText.trim() || undefined,
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

            {/* 세트 녹음 URL (선택) */}
            <div className="space-y-2">
                <Label htmlFor="set_recording_url">세트 녹음 URL (선택)</Label>
                <Input
                    id="set_recording_url"
                    type="url"
                    value={setRecordingUrl}
                    onChange={(e) => setSetRecordingUrl(e.target.value)}
                    placeholder="SoundCloud, Mixcloud 등"
                />
            </div>

            {/* 라인업 (선택) */}
            <div className="space-y-2">
                <Label htmlFor="lineup_text">라인업 (선택)</Label>
                <Textarea
                    id="lineup_text"
                    value={lineupText}
                    onChange={(e) => setLineupText(e.target.value)}
                    placeholder="아티스트 이름들 (줄바꿈으로 구분)"
                    rows={3}
                />
            </div>

            {/* 메모 (선택) */}
            <div className="space-y-2">
                <Label htmlFor="notes">메모 (선택)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="개인 메모"
                    rows={2}
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
export function eventToFormData(event: DBEventWithVenue): {
    initialData: Partial<EventFormData>;
    initialVenue: DBVenueSearchResult;
} {
    return {
        initialData: {
            venue_ref_id: event.venue_ref_id,
            title: event.title || '',
            date: event.date,
            data: event.data || {},
        },
        initialVenue: {
            ...event.venue,
            event_count: 0,
        },
    };
}
