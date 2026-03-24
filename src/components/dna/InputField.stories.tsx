import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { InputField } from './InputField';

const meta: Meta<typeof InputField> = {
    title: 'DNA/Input/InputField',
    component: InputField,
};

export default meta;
type Story = StoryObj<typeof InputField>;

export const Default: Story = {
    args: {
        label: 'Event Title',
        placeholder: 'Enter event title...',
    },
};

export const Required: Story = {
    args: {
        label: 'Venue Name',
        required: true,
        placeholder: 'Required field',
    },
};

export const WithHint: Story = {
    args: {
        label: 'SoundCloud URL',
        placeholder: 'https://soundcloud.com/...',
        hint: 'Paste the full URL to your SoundCloud track or set',
    },
};

export const Multiline: Story = {
    args: {
        label: 'Description',
        multiline: true,
        placeholder: 'Write a description...',
    },
};
