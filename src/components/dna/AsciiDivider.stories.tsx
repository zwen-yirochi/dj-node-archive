import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AsciiDivider } from './AsciiDivider';

const meta: Meta<typeof AsciiDivider> = {
    title: 'DNA/Texture/AsciiDivider',
    component: AsciiDivider,
};

export default meta;
type Story = StoryObj<typeof AsciiDivider>;

export const Default: Story = {};

export const WithText: Story = {
    args: {
        text: 'SECTION BREAK',
    },
};
