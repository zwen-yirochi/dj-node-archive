import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TextField from './TextField';

const meta: Meta<typeof TextField> = {
    title: 'Dashboard/SharedFields/TextField',
    component: TextField,
    decorators: [
        (Story) => (
            <div className="w-80 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
    args: {
        value: '',
        placeholder: 'Enter text...',
    },
};

export const AsTitle: Story = {
    args: {
        value: 'My Event Title',
        className: 'text-xl font-bold text-dashboard-text',
    },
};

export const Textarea: Story = {
    args: {
        value: '',
        variant: 'textarea',
        placeholder: 'Add a description...',
        className: 'text-sm leading-relaxed text-dashboard-text-muted',
    },
};

export const TextareaWithContent: Story = {
    args: {
        value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        variant: 'textarea',
        className: 'text-sm leading-relaxed text-dashboard-text-muted',
    },
};

export const Disabled: Story = {
    args: {
        value: 'Read-only text',
        disabled: true,
    },
};
