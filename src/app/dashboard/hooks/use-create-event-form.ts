import { type PublishOption } from '@/app/dashboard/config/workflowOptions';
import { useEditorData, useEntryMutations } from '.';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import {
    draftEventSchema,
    publishEventSchema,
    type CreateEventData,
} from '@/lib/validations/entry.schemas';
import { selectSetView, useDashboardStore } from '../stores/dashboardStore';
import type { EventEntry } from '@/types/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export function useCreateEventForm() {
    // publishOption에 따라 resolver가 전환 (draft ↔ publish)
    const [publishOption, setPublishOption] = useState<PublishOption>('private');
    const publishOptionRef = useRef(publishOption);
    publishOptionRef.current = publishOption;

    const form = useForm<CreateEventData>({
        resolver: (values, context, options) => {
            const schema =
                publishOptionRef.current === 'publish' ? publishEventSchema : draftEventSchema;
            return zodResolver(schema)(values, context, options);
        },
        mode: 'onTouched',
        defaultValues: {
            title: '',
            posterUrl: '',
            date: '',
            venue: { name: '' },
            lineup: [],
            description: '',
        },
    });

    const {
        handleSubmit,
        watch,
        reset,
        setError,
        clearErrors,
        trigger,
        formState: { errors, isSubmitting },
    } = form;

    // TanStack Query
    const { data } = useEditorData();
    const { create: createEntryMutation } = useEntryMutations();

    // Store
    const setView = useDashboardStore(selectSetView);

    // Submit 버튼 활성화: draftEventSchema 최소 조건 (title + posterUrl)
    const [title, posterUrl] = watch(['title', 'posterUrl']);
    const canCreate = !!title?.trim() && !!posterUrl?.trim();

    const handleCancel = () => {
        reset();
        setPublishOption('private');
        setView({ kind: 'page' });
    };

    const handlePublishOptionChange = (value: PublishOption) => {
        if (value === 'publish') {
            const result = publishEventSchema.safeParse(form.getValues());
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    title: 'Cannot publish',
                    description: 'All fields must be filled to publish.',
                });
                return;
            }
        }
        setPublishOption(value);
        trigger();
    };

    const onSubmit = async (formData: CreateEventData) => {
        // resolver가 publishOption에 맞는 스키마로 이미 검증 완료
        clearErrors('root');

        if (!data.pageId) {
            setError('root', { type: 'server', message: 'Page ID is not set. Please refresh.' });
            return;
        }

        try {
            const newEntry = {
                ...createEmptyEntry('event'),
                ...formData,
                title: formData.title.trim(),
                date: formData.date || new Date().toISOString().split('T')[0],
                description: formData.description?.trim() || '',
            } as EventEntry;

            await createEntryMutation.mutateAsync({
                pageId: data.pageId,
                entry: newEntry,
                publishOption,
            });
            setView({ kind: 'detail', entryId: newEntry.id });

            toast({
                title: 'Event created',
                description:
                    publishOption === 'publish' ? 'Event published.' : 'Event saved as private.',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';

            if (message.includes('title')) {
                setError('title', { type: 'server', message });
            } else if (message.includes('poster')) {
                setError('posterUrl', { type: 'server', message });
            } else {
                setError('root', { type: 'server', message });
                toast({
                    variant: 'destructive',
                    title: 'Creation failed',
                    description: message,
                });
            }
        }
    };

    return {
        form,
        publishOption,
        canCreate,
        errors,
        isSubmitting,
        handleCancel,
        handlePublishOptionChange,
        handleSubmit: handleSubmit(onSubmit),
    };
}
