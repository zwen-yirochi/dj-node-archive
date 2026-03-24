import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { StatsRow } from './StatsRow';

const meta: Meta<typeof StatsRow> = {
    title: 'DNA/Data Display/StatsRow',
    component: StatsRow,
};

export default meta;
type Story = StoryObj<typeof StatsRow>;

export const ThreeStats: Story = {
    args: {
        stats: [
            { number: '47', label: 'Events' },
            { number: '12', label: 'Venues' },
            { number: '89', label: 'Artists' },
        ],
    },
};

export const FourStats: Story = {
    args: {
        stats: [
            { number: '156', label: 'Events' },
            { number: '34', label: 'Venues' },
            { number: '212', label: 'Artists' },
            { number: '18', label: 'Mixsets' },
        ],
    },
};
