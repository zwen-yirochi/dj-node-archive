'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EventForm, type EventFormData } from './EventForm';
import type { DBEventWithVenue } from '@/types/database';

export interface CreateEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (event: DBEventWithVenue) => void;
}

export function CreateEventModal({ open, onOpenChange, onCreated }: CreateEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: EventFormData) => {
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
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
                throw new Error(json.error || '이벤트 생성에 실패했습니다.');
            }

            const eventId = json.data.id;

            // 퍼포머 저장 (있는 경우)
            if (data.performers && data.performers.length > 0) {
                const performersPayload = data.performers.map((p) => ({
                    user_id: p.type === 'user' ? p.id : undefined,
                    artist_ref_id: p.type === 'artist' ? p.id : undefined,
                }));

                await fetch(`/api/events/${eventId}/performers`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ performers: performersPayload }),
                });
            }

            // 생성된 이벤트에 venue 정보 추가
            const createdEvent: DBEventWithVenue = {
                ...json.data,
                venue: data.venue!,
            };

            onCreated?.(createdEvent);
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>새 이벤트 추가</DialogTitle>
                    <DialogDescription>공연 정보를 입력하세요.</DialogDescription>
                </DialogHeader>

                <EventForm
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    submitLabel="추가"
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}
