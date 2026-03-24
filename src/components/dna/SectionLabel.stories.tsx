import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SectionLabel } from './SectionLabel';

const meta: Meta<typeof SectionLabel> = {
    title: 'DNA/Chrome/SectionLabel',
    component: SectionLabel,
};

export default meta;
type Story = StoryObj<typeof SectionLabel>;

export const Default: Story = {
    args: {
        children: 'Event Nodes',
    },
};

export const WithRight: Story = {
    args: {
        children: 'Recent Activity',
        right: '12 items',
    },
};
