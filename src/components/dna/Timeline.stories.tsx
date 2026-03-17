import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Timeline } from './Timeline';

const meta: Meta<typeof Timeline> = {
    title: 'DNA/Data Display/Timeline',
    component: Timeline,
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
    args: {
        entries: [
            { date: '15 DEC 2024', title: 'NOCTURNAL FREQUENCIES', venue: 'Cakeshop' },
            { date: '08 NOV 2024', title: 'DEEP STATE', venue: 'Faust' },
            { date: '21 OCT 2024', title: 'SUBTERRANEAN', venue: 'Contra' },
        ],
    },
};

export const WithLinks: Story = {
    args: {
        entries: [
            {
                date: '15 DEC 2024',
                title: 'NOCTURNAL FREQUENCIES',
                venue: 'Cakeshop',
                link: '/venue/cakeshop',
            },
            {
                date: '08 NOV 2024',
                title: 'DEEP STATE',
                venue: 'Faust',
                link: '/venue/faust',
            },
            { date: '21 OCT 2024', title: 'SUBTERRANEAN', venue: 'Contra' },
        ],
    },
};

export const WithImages: Story = {
    args: {
        entries: [
            {
                date: '15 DEC 2024',
                title: 'NOCTURNAL FREQUENCIES',
                venue: 'Cakeshop',
                imageUrl: 'https://picsum.photos/seed/evt1/96/96',
                link: '/demo-dj/nocturnal-frequencies',
            },
            {
                date: '08 NOV 2024',
                title: 'DEEP STATE',
                venue: 'Faust',
                imageUrl: 'https://picsum.photos/seed/evt2/96/96',
            },
            { date: '21 OCT 2024', title: 'SUBTERRANEAN', venue: 'Contra' },
        ],
    },
};
