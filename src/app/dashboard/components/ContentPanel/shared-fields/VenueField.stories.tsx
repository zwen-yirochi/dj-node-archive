import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import VenueField from './VenueField';

const meta: Meta<typeof VenueField> = {
    title: 'Dashboard/SharedFields/VenueField',
    component: VenueField,
    decorators: [
        (Story) => (
            <div className="w-80 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof VenueField>;

export const Empty: Story = {
    args: {
        value: { name: '' },
        placeholder: 'Search venue...',
    },
};

export const WithSelectedVenue: Story = {
    args: {
        value: { id: 'venue-1', name: 'Berghain' },
    },
};

export const Disabled: Story = {
    args: {
        value: { id: 'venue-1', name: 'Berghain' },
        disabled: true,
    },
};

export const WithFreeText: Story = {
    args: {
        value: { name: 'Some custom venue' },
    },
};

export const WithCustomPlaceholder: Story = {
    args: {
        value: { name: '' },
        placeholder: 'Type to search venues...',
    },
};
