import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DnaBreadcrumb } from './DnaBreadcrumb';

const meta: Meta<typeof DnaBreadcrumb> = {
    title: 'DNA/Navigation/DnaBreadcrumb',
    component: DnaBreadcrumb,
};

export default meta;
type Story = StoryObj<typeof DnaBreadcrumb>;

export const Default: Story = {
    args: {
        items: [{ label: 'Demo DJ', href: '/demo-dj' }, { label: 'Midnight Session Vol.12' }],
    },
};

export const ThreeLevels: Story = {
    args: {
        items: [
            { label: 'Root', href: '/' },
            { label: 'Demo DJ', href: '/demo-dj' },
            { label: 'Groove Theory' },
        ],
    },
};

export const SingleItem: Story = {
    args: {
        items: [{ label: 'Home' }],
    },
};
