import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NodeItem } from './NodeItem';

const meta: Meta<typeof NodeItem> = {
    title: 'DNA/Data Display/NodeItem',
    component: NodeItem,
};

export default meta;
type Story = StoryObj<typeof NodeItem>;

export const Venue: Story = {
    args: {
        index: 1,
        type: 'VEN',
        name: 'Cakeshop',
        detail: 'Seoul, Itaewon',
        href: '/venue/cakeshop',
    },
};

export const Artist: Story = {
    args: {
        index: 2,
        type: 'ART',
        name: 'DJ Soulscape',
        detail: '12 Events',
        href: '/artist/soulscape',
    },
};

export const Event: Story = {
    args: {
        index: 3,
        type: 'EVT',
        name: 'Nocturnal Frequencies',
        detail: '15 Dec 2024',
        href: '/event/nocturnal',
    },
};
