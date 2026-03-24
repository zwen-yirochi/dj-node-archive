import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import ImageField from './ImageField';

const meta: Meta<typeof ImageField> = {
    title: 'Dashboard/SharedFields/ImageField',
    component: ImageField,
    decorators: [
        (Story) => (
            <div className="w-96 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof ImageField>;

export const Empty: Story = {
    args: {
        value: [],
    },
};

export const SingleImage: Story = {
    args: {
        value: [{ id: 'img-1', url: 'https://picsum.photos/seed/a/400/533' }],
    },
};

export const MultipleImages: Story = {
    args: {
        value: [
            { id: 'img-1', url: 'https://picsum.photos/seed/a/400/533' },
            { id: 'img-2', url: 'https://picsum.photos/seed/b/600/400' },
            { id: 'img-3', url: 'https://picsum.photos/seed/c/400/400' },
        ],
    },
};

export const MaxCountReached: Story = {
    args: {
        value: [
            { id: 'img-1', url: 'https://picsum.photos/seed/d/400/400' },
            { id: 'img-2', url: 'https://picsum.photos/seed/e/600/400' },
        ],
        maxCount: 2,
    },
};

export const Disabled: Story = {
    args: {
        value: [{ id: 'img-1', url: 'https://picsum.photos/seed/g/400/533' }],
        disabled: true,
    },
};
