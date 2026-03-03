'use client';

import { useEffect, useRef } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { eventFieldSchemas, type EventDescriptionForm } from '@/lib/validations/entry.schemas';

import type { FieldBlockProps } from '../types';

export default function DescriptionBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const description = 'description' in entry ? (entry.description as string) || '' : '';

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

    return (
        <div>
            <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
            <textarea
                {...register('description')}
                disabled={disabled}
                placeholder="Add a description..."
                rows={4}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-dashboard-text-muted outline-none placeholder:text-dashboard-text-placeholder"
            />
        </div>
    );
}
