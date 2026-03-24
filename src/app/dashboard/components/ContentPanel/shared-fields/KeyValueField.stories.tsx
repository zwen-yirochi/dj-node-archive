import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import KeyValueField from './KeyValueField';

const TRACKLIST_COLUMNS = [
    {
        key: 'time',
        placeholder: '0:00',
        width: 'w-12 shrink-0',
        className: 'font-mono text-xs text-dashboard-text-placeholder',
    },
    { key: 'track', placeholder: 'Track title', width: 'min-w-0 flex-1' },
    {
        key: 'artist',
        placeholder: 'Artist',
        className: 'text-dashboard-text-placeholder',
    },
];

const SIMPLE_COLUMNS = [
    { key: 'key', placeholder: 'Key', width: 'w-24 shrink-0' },
    { key: 'value', placeholder: 'Value', width: 'min-w-0 flex-1' },
];

const meta: Meta<typeof KeyValueField> = {
    title: 'Dashboard/SharedFields/KeyValueField',
    component: KeyValueField,
    decorators: [
        (Story) => (
            <div className="w-96 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof KeyValueField>;

export const Empty: Story = {
    args: {
        value: [],
        columns: SIMPLE_COLUMNS,
        emptyItem: { key: '', value: '' },
        addLabel: 'Add item',
    },
};

export const Tracklist: Story = {
    args: {
        value: [
            { time: '0:00', track: 'Intro', artist: 'DJ Shadow' },
            { time: '3:45', track: 'Midnight City', artist: 'M83' },
            { time: '7:20', track: 'Strobe', artist: 'Deadmau5' },
        ],
        columns: TRACKLIST_COLUMNS,
        emptyItem: { track: '', artist: '', time: '0:00' },
        addLabel: 'Add track',
    },
};

export const TracklistEmpty: Story = {
    args: {
        value: [],
        columns: TRACKLIST_COLUMNS,
        emptyItem: { track: '', artist: '', time: '0:00' },
        addLabel: 'Add track',
    },
};

export const SimpleKeyValue: Story = {
    args: {
        value: [
            { key: 'Genre', value: 'House' },
            { key: 'BPM', value: '128' },
        ],
        columns: SIMPLE_COLUMNS,
        emptyItem: { key: '', value: '' },
        addLabel: 'Add item',
    },
};

export const Disabled: Story = {
    args: {
        value: [
            { time: '0:00', track: 'Intro', artist: 'DJ Shadow' },
            { time: '3:45', track: 'Midnight City', artist: 'M83' },
        ],
        columns: TRACKLIST_COLUMNS,
        emptyItem: { track: '', artist: '', time: '0:00' },
        disabled: true,
    },
};
