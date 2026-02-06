import { Calendar, Headphones, Link as LinkIcon } from 'lucide-react';
import type { EntryType } from '@/stores/uiStore';
import type { RegisterOptions } from 'react-hook-form';

// ============================================
// Entry Type Config
// ============================================

export interface EntryTypeConfig {
    icon: typeof Calendar;
    label: string;
    titlePlaceholder: string;
    bgColor: string;
    textColor: string;
}

export const ENTRY_TYPE_CONFIG: Record<EntryType, EntryTypeConfig> = {
    event: {
        icon: Calendar,
        label: 'Event',
        titlePlaceholder: 'Enter event title',
        bgColor: 'bg-blue-50',
        textColor: 'text-dashboard-type-event',
    },
    mixset: {
        icon: Headphones,
        label: 'Mixset',
        titlePlaceholder: 'Enter mixset title',
        bgColor: 'bg-purple-50',
        textColor: 'text-dashboard-type-mixset',
    },
    link: {
        icon: LinkIcon,
        label: 'Link',
        titlePlaceholder: 'Enter link title',
        bgColor: 'bg-green-50',
        textColor: 'text-dashboard-type-link',
    },
};

// ============================================
// Event Creation Options
// ============================================

export type EventCreateOption = 'import' | 'create';

export interface EventOptionConfig {
    id: EventCreateOption;
    label: string;
    description: string;
}

export const EVENT_CREATE_OPTIONS: EventOptionConfig[] = [
    {
        id: 'import',
        label: 'Import existing',
        description: 'Search and import from database',
    },
    {
        id: 'create',
        label: 'Create new',
        description: 'Start from scratch',
    },
];

// ============================================
// Event Form Types
// ============================================

export interface EventFormData {
    title: string;
    posterUrl: string;
    date: string;
    venue: { id?: string; name: string };
    lineup: { id?: string; name: string }[];
    description: string;
}

export type PublishOption = 'publish' | 'private';

export interface PublishOptionConfig {
    id: PublishOption;
    label: string;
    description: string;
}

export const PUBLISH_OPTIONS: PublishOptionConfig[] = [
    {
        id: 'publish',
        label: 'Publish',
        description: 'Visible to everyone. Requires all fields.',
    },
    {
        id: 'private',
        label: 'Private',
        description: 'Only visible to you. Requires title and poster.',
    },
];

// ============================================
// Validation Rules
// ============================================

export const EVENT_VALIDATION_RULES = {
    title: {
        required: 'Title is required',
        minLength: { value: 2, message: 'Title must be at least 2 characters' },
        maxLength: { value: 100, message: 'Title must be 100 characters or less' },
    },
    posterUrl: {
        required: 'Poster image is required',
    },
} satisfies Record<string, RegisterOptions<EventFormData>>;
