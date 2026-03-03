'use client';

import { useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Calendar } from 'lucide-react';

import { eventFieldSchemas, type EventDateForm } from '@/lib/validations/entry.schemas';

import type { FieldBlockProps } from '../types';

export default function DateBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const isEvent = entry.type === 'event';
    const date = isEvent ? entry.date : '';

    const {
        register,
        watch,
        formState: { errors, isDirty },
        reset,
    } = useForm<EventDateForm>({
        resolver: zodResolver(eventFieldSchemas.date),
        defaultValues: { date },
        mode: 'onChange',
    });

    useEffect(() => {
        if (!isDirty) {
            reset({ date });
        }
    }, [date, isDirty, reset]);

    const dateValue = watch('date');
    useEffect(() => {
        if (dateValue !== date && !errors.date) {
            onSave('date', dateValue);
        }
    }, [dateValue]);

    if (!isEvent) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <div className="flex-1">
                <input
                    type="date"
                    {...register('date')}
                    disabled={disabled}
                    className="w-full bg-transparent text-dashboard-text-secondary outline-none"
                />
                {date && (
                    <p className="mt-0.5 text-xs text-dashboard-text-placeholder">
                        {formatDate(date)}
                    </p>
                )}
            </div>
            {errors.date && (
                <span className="text-xs text-dashboard-danger">{errors.date.message}</span>
            )}
        </div>
    );
}
