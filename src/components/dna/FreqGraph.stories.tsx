import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FreqGraph } from './FreqGraph';

const meta: Meta<typeof FreqGraph> = {
    title: 'DNA/Data Display/FreqGraph',
    component: FreqGraph,
};

export default meta;
type Story = StoryObj<typeof FreqGraph>;

export const Default: Story = {
    args: {
        bars: [
            { height: 20 },
            { height: 45 },
            { height: 70 },
            { height: 90 },
            { height: 60 },
            { height: 85 },
            { height: 40 },
            { height: 55 },
            { height: 75 },
            { height: 30 },
            { height: 95 },
            { height: 50 },
            { height: 65 },
            { height: 80 },
            { height: 35 },
            { height: 10 },
            { height: 45 },
            { height: 70 },
            { height: 55 },
            { height: 25 },
        ],
    },
};
