import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ExternalLinks } from './ExternalLinks';

const meta: Meta<typeof ExternalLinks> = {
    title: 'DNA/Chrome/ExternalLinks',
    component: ExternalLinks,
};

export default meta;
type Story = StoryObj<typeof ExternalLinks>;

export const Default: Story = {
    args: {
        links: [
            { label: 'Instagram', href: 'https://instagram.com/example' },
            { label: 'Website', href: 'https://example.com' },
        ],
    },
};

export const ManyLinks: Story = {
    args: {
        links: [
            { label: 'Instagram', href: 'https://instagram.com/example' },
            { label: 'Website', href: 'https://example.com' },
            { label: 'Google Maps', href: 'https://maps.google.com' },
            { label: 'Resident Advisor', href: 'https://ra.co/clubs/12345' },
        ],
    },
};

export const SingleLink: Story = {
    args: {
        links: [{ label: 'SoundCloud', href: 'https://soundcloud.com/example' }],
    },
};
