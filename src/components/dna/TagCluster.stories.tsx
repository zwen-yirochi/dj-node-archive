import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TagCluster } from './TagCluster';

const meta: Meta<typeof TagCluster> = {
    title: 'DNA/Data Display/TagCluster',
    component: TagCluster,
};

export default meta;
type Story = StoryObj<typeof TagCluster>;

export const Default: Story = {
    args: {
        tags: [
            { label: 'Techno' },
            { label: 'House' },
            { label: 'Ambient' },
            { label: 'Drum & Bass' },
            { label: 'Dub' },
        ],
    },
};

export const WithActive: Story = {
    args: {
        tags: [
            { label: 'Techno', active: true },
            { label: 'House' },
            { label: 'Ambient', active: true },
            { label: 'Drum & Bass' },
            { label: 'Dub' },
        ],
    },
};

export const Interactive: Story = {
    args: {
        tags: [{ label: 'Techno' }, { label: 'House' }, { label: 'Ambient' }, { label: 'Minimal' }],
    },
};
