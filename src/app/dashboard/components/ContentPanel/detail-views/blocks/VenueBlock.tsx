'use client';

import { useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { MapPin } from 'lucide-react';

import { eventFieldSchemas, type EventVenueForm } from '@/lib/validations/entry.schemas';

import type { FieldBlockProps } from '../types';

export default function VenueBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const isEvent = entry.type === 'event';
    const venue = isEvent ? entry.venue : { name: '' };

    const {
        register,
        watch,
        formState: { errors, isDirty },
        reset,
    } = useForm<EventVenueForm>({
        resolver: zodResolver(eventFieldSchemas.venue),
        defaultValues: { venue },
        mode: 'onChange',
    });

    useEffect(() => {
        if (!isDirty) {
            reset({ venue });
        }
    }, [venue, isDirty, reset]);

    const venueName = watch('venue.name');
    useEffect(() => {
        if (venueName !== venue.name && !errors.venue?.name) {
            onSave('venue', { ...venue, name: venueName });
        }
    }, [venueName]);

    if (!isEvent) return null;

    return (
        <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <input
                {...register('venue.name')}
                disabled={disabled}
                placeholder="Enter venue name"
                className="flex-1 bg-transparent text-dashboard-text-secondary outline-none placeholder:text-dashboard-text-placeholder"
            />
            {errors.venue?.name && (
                <span className="text-xs text-dashboard-danger">{errors.venue.name.message}</span>
            )}
        </div>
    );
}
