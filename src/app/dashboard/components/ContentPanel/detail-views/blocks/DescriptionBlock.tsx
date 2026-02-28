'use client';

import { useEffect, useRef } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { eventFieldSchemas, type EventDescriptionForm } from '@/lib/validations/entry.schemas';

import type { FieldBlockProps } from '../types';

export default function DescriptionBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const isEvent = entry.type === 'event';
    const description = isEvent ? entry.description || '' : '';

    const prevValueRef = useRef(description);

    const {
        register,
        watch,
        formState: { isDirty },
        reset,
    } = useForm<EventDescriptionForm>({
        resolver: zodResolver(eventFieldSchemas.description),
        defaultValues: { description },
        mode: 'onChange',
    });

    useEffect(() => {
        if (!isDirty) {
            reset({ description });
            prevValueRef.current = description;
        }
    }, [description, isDirty, reset]);

    const descriptionValue = watch('description');
    useEffect(() => {
        if (descriptionValue !== prevValueRef.current) {
            prevValueRef.current = descriptionValue;
            onSave('description', descriptionValue);
        }
    }, [descriptionValue]);

    if (!isEvent) return null;

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                설명
            </p>
            <textarea
                {...register('description')}
                disabled={disabled}
                placeholder="쇼에 대한 설명을 입력하세요..."
                rows={4}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-dashboard-text-muted outline-none placeholder:text-dashboard-text-placeholder"
            />
        </div>
    );
}
