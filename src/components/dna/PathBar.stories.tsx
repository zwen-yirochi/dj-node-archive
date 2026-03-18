import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PathBar } from './PathBar';

const meta: Meta<typeof PathBar> = {
    title: 'DNA/Navigation/PathBar',
    component: PathBar,
};

export default meta;
type Story = StoryObj<typeof PathBar>;

export const Default: Story = {
    args: {
        items: [{ label: 'root', href: '/' }, { label: 'discovery' }],
    },
};

export const WithMeta: Story = {
    args: {
        items: [
            { label: 'root', href: '/' },
            { label: 'discover', href: '/discover' },
            { label: 'venues' },
            { label: 'cakeshop' },
        ],
        meta: 'node: VN-A3F2 // type: venue',
    },
};

export const WithLinks: Story = {
    args: {
        items: [
            { label: 'root', href: '/' },
            { label: 'Demo DJ', href: '/demo-dj' },
            { label: 'midnight session vol.12' },
        ],
        meta: 'type: event',
    },
};
