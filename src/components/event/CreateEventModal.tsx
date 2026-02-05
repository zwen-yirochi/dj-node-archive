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
import type { DBEvent } from '@/types/database';

export interface CreateEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (event: DBEvent) => void;
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
                    venue: data.venue,
                    title: data.title,
                    date: data.date,
                    lineup: data.lineup,
                    data: data.data,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || '이벤트 생성에 실패했습니다.');
            }

            const createdEvent: DBEvent = json.data;

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
