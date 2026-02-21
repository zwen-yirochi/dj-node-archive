import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
    title: 'DNA/Chrome/Footer',
    component: Footer,
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
    args: {
        meta: ['SYSTEM: CTX.ARCHIVE', 'BUILD: 2024.12.15', 'STATUS: OPERATIONAL'],
        bottom: {
            left: '2024 CTX',
            center: 'Seoul, KR',
            right: 'All rights reserved',
        },
    },
};

export const WithAscii: Story = {
    args: {
        meta: ['SYSTEM: CTX.ARCHIVE', 'BUILD: 2024.12.15'],
        ascii: ' /\\\n/  \\\n\\  /\n \\/',
        bottom: {
            left: '2024 CTX',
            right: 'v0.1.0',
        },
    },
};
