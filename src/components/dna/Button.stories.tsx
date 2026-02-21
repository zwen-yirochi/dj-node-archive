import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'DNA/Input/Button',
    component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Submit Entry',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Cancel',
    },
};

export const Full: Story = {
    args: {
        variant: 'primary',
        full: true,
        children: 'Full Width Action',
    },
};

export const Disabled: Story = {
    args: {
        variant: 'primary',
        disabled: true,
        children: 'Disabled',
    },
};
