import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import EventStackGroup from './EventStackGroup';

const meta: Meta<typeof EventStackGroup> = {
    title: 'DNA/Data Display/EventStackGroup',
    component: EventStackGroup,
};

export default meta;
type Story = StoryObj<typeof EventStackGroup>;

export const Default: Story = {
    args: {
        stackTitle: 'Nocturnal Frequencies',
        eventCount: 3,
        entries: [
            { date: '15 DEC 2024', title: 'NOCTURNAL FREQUENCIES VOL.3', venue: 'Cakeshop' },
            { date: '10 SEP 2024', title: 'NOCTURNAL FREQUENCIES VOL.2', venue: 'Cakeshop' },
            { date: '01 JUN 2024', title: 'NOCTURNAL FREQUENCIES VOL.1', venue: 'Faust' },
        ],
    },
};

export const SingleEvent: Story = {
    args: {
        stackTitle: 'Deep State',
        eventCount: 1,
        entries: [{ date: '08 NOV 2024', title: 'DEEP STATE', venue: 'Faust' }],
    },
};
