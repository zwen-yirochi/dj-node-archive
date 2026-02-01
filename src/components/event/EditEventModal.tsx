'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EventForm, eventToFormData, type EventFormData } from './EventForm';
import type { TaggedArtist } from '@/components/artist/ArtistTagger';
import type { DBEventWithVenue } from '@/types/database';

export interface EditEventModalProps {
    event: DBEventWithVenue | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated?: (event: DBEventWithVenue) => void;
}

export function EditEventModal({ event, open, onOpenChange, onUpdated }: EditEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialPerformers, setInitialPerformers] = useState<TaggedArtist[]>([]);

    // 기존 퍼포머 로드
    useEffect(() => {
        if (event && open) {
            fetch(`/api/events/${event.id}/performers`)
                .then((res) => res.json())
                .then((json) => {
                    if (json.data) {
                        const performers: TaggedArtist[] = json.data
                            .map(
                                (p: {
                                    user?: {
                                        id: string;
                                        username: string;
                                        display_name?: string;
                                        avatar_url?: string;
                                    };
                                    artist?: { id: string; name: string; instagram?: string };
                                }) => {
                                    if (p.user) {
                                        return {
                                            type: 'user' as const,
                                            id: p.user.id,
                                            name: p.user.display_name || p.user.username,
                                            username: p.user.username,
                                            avatar_url: p.user.avatar_url,
                                        };
                                    } else if (p.artist) {
                                        return {
                                            type: 'artist' as const,
                                            id: p.artist.id,
                                            name: p.artist.name,
                                            instagram: p.artist.instagram,
                                        };
                                    }
                                    return null;
                                }
                            )
                            .filter(Boolean);
                        setInitialPerformers(performers);
                    }
                })
                .catch(console.error);
        }
    }, [event, open]);

    if (!event) return null;

    const { initialData, initialVenue } = eventToFormData(event);

    const handleSubmit = async (data: EventFormData) => {
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_ref_id: data.venue_ref_id,
                    title: data.title,
                    date: data.date,
                    data: data.data,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || '이벤트 수정에 실패했습니다.');
            }

            // 퍼포머 업데이트
            if (data.performers) {
                const performersPayload = data.performers.map((p) => ({
                    user_id: p.type === 'user' ? p.id : undefined,
                    artist_ref_id: p.type === 'artist' ? p.id : undefined,
                }));

                await fetch(`/api/events/${event.id}/performers`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ performers: performersPayload }),
                });
            }

            // 수정된 이벤트에 venue 정보 추가
            const updatedEvent: DBEventWithVenue = {
                ...json.data,
                venue: data.venue!,
            };

            onUpdated?.(updatedEvent);
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>이벤트 수정</DialogTitle>
                    <DialogDescription>공연 정보를 수정하세요.</DialogDescription>
                </DialogHeader>

                <EventForm
                    initialData={initialData}
                    initialVenue={initialVenue}
                    initialPerformers={initialPerformers}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    submitLabel="저장"
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}
