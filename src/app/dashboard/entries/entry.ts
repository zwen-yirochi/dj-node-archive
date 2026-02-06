import { Calendar, Headphones, Link as LinkIcon } from 'lucide-react';
import type { EntryType } from '@/stores/uiStore';

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

// Event creation options
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
