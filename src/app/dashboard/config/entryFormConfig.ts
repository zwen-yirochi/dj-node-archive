/**
 * Entry creation form configuration
 *
 * Defines form-specific concerns only (defaultValues, toEntry, errorFieldMap).
 * schemas, label, and canCreate are derived from existing config:
 * - ENTRY_SCHEMAS[type] -> draftSchema / publishSchema
 * - ENTRY_TYPE_CONFIG[type] -> label
 * - draftSchema.safeParse -> canCreate
 */

import type { EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { createEmptyEntry } from '@/lib/mappers';
import type {
    CreateEventData,
    CreateLinkFormData,
    CreateMixsetFormData,
} from '@/lib/validations/entry.schemas';

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

export const LINK_FORM_CONFIG: CreateEntryFormConfig<CreateLinkFormData> = {
    type: 'link',
    defaultValues: {
        title: '',
        url: '',
    },
    toEntry: (formData) =>
        ({
            ...createEmptyEntry('link'),
            title: formData.title.trim(),
            url: formData.url.trim(),
        }) as LinkEntry,
    errorFieldMap: { title: 'title', url: 'url' },
};
