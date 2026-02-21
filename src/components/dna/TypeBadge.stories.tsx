import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TypeBadge } from './TypeBadge';

const meta: Meta<typeof TypeBadge> = {
    title: 'DNA/Primitive/TypeBadge',
    component: TypeBadge,
    parameters: {
        viewport: { defaultViewport: 'responsive' },
    },
};

export default meta;
type Story = StoryObj<typeof TypeBadge>;

export const Venue: Story = { args: { type: 'VEN' } };
export const Artist: Story = { args: { type: 'ART' } };
export const Event: Story = { args: { type: 'EVT' } };
export const Mixset: Story = { args: { type: 'MIX' } };
export const Link: Story = { args: { type: 'LNK' } };
