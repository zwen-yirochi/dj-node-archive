/**
 * 엔트리 생성 폼 설정
 *
 * 폼 전용 관심사만 정의 (defaultValues, toEntry, errorFieldMap).
 * schemas, label, canCreate는 기존 config 체계에서 파생:
 * - ENTRY_SCHEMAS[type] → draftSchema / publishSchema
 * - ENTRY_TYPE_CONFIG[type] → label
 * - draftSchema.safeParse → canCreate
 */

import type { EventEntry, MixsetEntry } from '@/types/domain';
import { createEmptyEntry } from '@/lib/mappers';
import type { CreateEventData, CreateMixsetFormData } from '@/lib/validations/entry.schemas';

import type { CreateEntryFormConfig } from '../hooks/use-create-entry-form';

export const EVENT_FORM_CONFIG: CreateEntryFormConfig<CreateEventData> = {
    type: 'event',
    publishable: true,
    defaultValues: {
        title: '',
        posterUrl: '',
        date: '',
        venue: { name: '' },
        lineup: [],
        description: '',
    },
    toEntry: (formData) =>
        ({
            ...createEmptyEntry('event'),
            ...formData,
            title: formData.title.trim(),
            date: formData.date || new Date().toISOString().split('T')[0],
            description: formData.description?.trim() || '',
        }) as EventEntry,
    errorFieldMap: { title: 'title', poster: 'posterUrl' },
};

export const MIXSET_FORM_CONFIG: CreateEntryFormConfig<CreateMixsetFormData> = {
    type: 'mixset',
    defaultValues: {
        title: '',
        coverUrl: '',
        url: '',
    },
    toEntry: (formData) =>
        ({
            ...createEmptyEntry('mixset'),
            title: formData.title.trim(),
            coverUrl: formData.coverUrl || '',
            url: formData.url || '',
        }) as MixsetEntry,
    errorFieldMap: { title: 'title' },
};
