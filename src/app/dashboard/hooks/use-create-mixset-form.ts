import { useEditorData, useEntryMutations } from '.';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { draftMixsetSchema, type CreateMixsetFormData } from '@/lib/validations/entry.schemas';
import { selectSetView, useDashboardStore } from '../stores/dashboardStore';
import type { MixsetEntry } from '@/types/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function useCreateMixsetForm() {
    const form = useForm<CreateMixsetFormData>({
        // publish 구분이 없으므로 고정 스키마 — 동적 resolver 불필요
        resolver: zodResolver(draftMixsetSchema),
        mode: 'onTouched',
        defaultValues: {
            title: '',
            coverUrl: '',
            url: '',
        },
    });

    const {
        handleSubmit,
        watch,
        reset,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = form;

    // ── 외부 의존성 ──
    const { data } = useEditorData();
    const { create: createEntryMutation } = useEntryMutations();
    const setView = useDashboardStore(selectSetView);

    // ── Submit 활성화 조건 ──
    const title = watch('title');
    const canCreate = !!title?.trim();

    const handleCancel = () => {
        reset();
        setView({ kind: 'page' });
    };

    const onSubmit = async (formData: CreateMixsetFormData) => {
        clearErrors('root');

        if (!data.pageId) {
            setError('root', { type: 'server', message: 'Page ID is not set. Please refresh.' });
            return;
        }

        try {
            const newEntry = {
                ...createEmptyEntry('mixset'),
                title: formData.title.trim(),
                coverUrl: formData.coverUrl || '',
                url: formData.url || '',
            } as MixsetEntry;

            await createEntryMutation.mutateAsync({
                pageId: data.pageId,
                entry: newEntry,
            });
            setView({ kind: 'detail', entryId: newEntry.id });

            toast({ title: 'Mixset created', description: 'Mixset has been saved.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';

            if (message.includes('title')) {
                setError('title', { type: 'server', message });
            } else {
                setError('root', { type: 'server', message });
                toast({ variant: 'destructive', title: 'Creation failed', description: message });
            }
        }
    };

    return {
        form,
        canCreate,
        errors,
        isSubmitting,
        handleCancel,
        handleSubmit: handleSubmit(onSubmit),
    };
}
