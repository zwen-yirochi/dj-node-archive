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
// Publish Options
// ============================================

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
