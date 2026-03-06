import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type {
    EventEntry as EventEntryType,
    LinkEntry as LinkEntryType,
    MixsetEntry as MixsetEntryType,
    PublicEventEntry as PublicEventEntryType,
} from '@/types/domain';

import { EntryCard } from './EntryCard';

const meta: Meta<typeof EntryCard> = {
    title: 'DNA/Data Display/EntryCard',
    component: EntryCard,
};

export default meta;
type Story = StoryObj<typeof EntryCard>;

const baseEntry = {
    id: 'entry-001',
    position: 0,
    displayOrder: 0,
    isVisible: true,
    createdAt: '2024-12-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
};

export const EventEntry: Story = {
    args: {
        entry: {
            ...baseEntry,
            type: 'event',
            title: 'NOCTURNAL FREQUENCIES VOL.3',
            date: '2024-12-15',
            venue: { id: 'ven-a3f2', name: 'Cakeshop' },
            lineup: [{ name: 'DJ Soulscape' }],
            imageUrls: ['https://picsum.photos/seed/evt1/128/160'],
        } satisfies EventEntryType,
        index: 0,
    },
};

export const PublicEvent: Story = {
    args: {
        entry: {
            ...baseEntry,
            type: 'event',
            title: 'DEEP STATE SESSIONS',
            date: '2024-11-08',
            venue: { id: 'ven-b1c4', name: 'Faust' },
            lineup: [],
            imageUrls: ['https://picsum.photos/seed/evt2/128/160'],
            eventId: 'public-evt-001',
        } satisfies PublicEventEntryType,
        index: 1,
    },
};

export const Mixset: Story = {
    args: {
        entry: {
            ...baseEntry,
            type: 'mixset',
            title: 'Late Night Transmission #14',
            tracklist: [],
            imageUrls: [],
            durationMinutes: 62,
        } satisfies MixsetEntryType,
        index: 2,
    },
};

export const Link: Story = {
    args: {
        entry: {
            ...baseEntry,
            type: 'link',
            title: 'SoundCloud Profile',
            url: 'https://soundcloud.com/example',
            imageUrls: [],
        } satisfies LinkEntryType,
        index: 3,
    },
};
