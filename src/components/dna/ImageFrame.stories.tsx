import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ImageFrame } from './ImageFrame';

const meta: Meta<typeof ImageFrame> = {
    title: 'DNA/Texture/ImageFrame',
    component: ImageFrame,
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 320 }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ImageFrame>;

export const Default: Story = {
    args: {
        src: 'https://picsum.photos/seed/dna-frame/640/800',
        alt: 'Sample event poster',
    },
};

export const WithMeta: Story = {
    args: {
        src: 'https://picsum.photos/seed/dna-meta/640/800',
        alt: 'Event poster with meta',
        meta: { left: 'EVT-2024', right: 'DUOTONE.V3' },
    },
};
