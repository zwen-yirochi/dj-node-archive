import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ShareButton from './ShareButton';

const meta: Meta<typeof ShareButton> = {
    title: 'DNA/Actions/ShareButton',
    component: ShareButton,
};

export default meta;
type Story = StoryObj<typeof ShareButton>;

export const Default: Story = {};
