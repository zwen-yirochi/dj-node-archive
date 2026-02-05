'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EventForm, eventToFormData, type EventFormData } from './EventForm';
import type { DBEvent } from '@/types/database';

export interface EditEventModalProps {
    event: DBEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated?: (event: DBEvent) => void;
}

export function EditEventModal({ event, open, onOpenChange, onUpdated }: EditEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!event) return null;

    const { initialData, initialVenue, initialPerformers } = eventToFormData(event);

    const handleSubmit = async (data: EventFormData) => {
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue: data.venue,
                    title: data.title,
                    date: data.date,
                    lineup: data.lineup,
                    data: data.data,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || '이벤트 수정에 실패했습니다.');
            }

            const updatedEvent: DBEvent = json.data;

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
