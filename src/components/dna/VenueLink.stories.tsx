import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VenueLink } from './VenueLink';

const meta: Meta<typeof VenueLink> = {
    title: 'DNA/Primitive/VenueLink',
    component: VenueLink,
    parameters: {
        viewport: { defaultViewport: 'responsive' },
    },
};

export default meta;
type Story = StoryObj<typeof VenueLink>;

export const WithLink: Story = {
    args: {
        name: 'Faust Seoul',
        venueId: 'a1b2c3d4',
        href: '/venues/faust-seoul',
    },
};

export const WithoutLink: Story = {
    args: {
        name: 'Cakeshop',
        venueId: 'e5f6g7h8',
    },
};

export const NoVenueId: Story = {
    args: {
        name: 'Unknown Venue',
    },
};
