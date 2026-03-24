import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TopNav } from './TopNav';

const meta: Meta<typeof TopNav> = {
    title: 'DNA/Chrome/TopNav',
    component: TopNav,
};

export default meta;
type Story = StoryObj<typeof TopNav>;

export const Default: Story = {
    args: {
        logo: 'DNA:',
        links: [
            { label: 'Events', href: '/events', active: true },
            { label: 'Venues', href: '/venues' },
            { label: 'Artists', href: '/artists' },
            { label: 'Archive', href: '/archive' },
        ],
        version: 'v0.1.0',
    },
};
