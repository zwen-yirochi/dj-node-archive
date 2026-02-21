import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NodeLabel } from './NodeLabel';

const meta: Meta<typeof NodeLabel> = {
    title: 'DNA/Chrome/NodeLabel',
    component: NodeLabel,
    parameters: {
        viewport: { defaultViewport: 'responsive' },
    },
};

export default meta;
type Story = StoryObj<typeof NodeLabel>;

export const Venue: Story = {
    args: {
        children: 'Venue Node',
        right: 'VN-A1B2',
    },
};

export const Event: Story = {
    args: {
        children: 'Event Node',
        right: '2025.06.14 // SAT',
    },
};

export const Artist: Story = {
    args: {
        children: 'Artist Node',
    },
};
