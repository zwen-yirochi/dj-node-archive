import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LineupText } from './LineupText';

const meta: Meta<typeof LineupText> = {
    title: 'DNA/Data Display/LineupText',
    component: LineupText,
};

export default meta;
type Story = StoryObj<typeof LineupText>;

export const Default: Story = {
    args: {
        artists: [{ name: 'DJ Soulscape' }, { name: 'MOGWAA' }, { name: 'PARK HYE JIN' }],
    },
};

export const WithLinkedArtists: Story = {
    args: {
        artists: [
            { name: 'DJ Soulscape', linked: true },
            { name: 'MOGWAA' },
            { name: 'PARK HYE JIN', linked: true },
        ],
    },
};

export const SingleArtist: Story = {
    args: {
        artists: [{ name: 'YETSUBY' }],
    },
};

export const EmptyWithFallback: Story = {
    args: {
        artists: [],
        fallback: 'TBA',
    },
};

export const EmptyNoFallback: Story = {
    args: {
        artists: [],
    },
};
