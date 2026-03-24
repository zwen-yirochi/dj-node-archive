import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import LinkField from './LinkField';

const meta: Meta<typeof LinkField> = {
    title: 'Dashboard/SharedFields/LinkField',
    component: LinkField,
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
type Story = StoryObj<typeof LinkField>;

export const Empty: Story = {
    args: {
        value: '',
    },
};

export const WithUrl: Story = {
    args: {
        value: 'https://soundcloud.com/example-mix',
    },
};

export const LongUrl: Story = {
    args: {
        value: 'https://www.example.com/very/long/path/to/some/resource?query=param&another=value',
    },
};

export const CustomPlaceholder: Story = {
    args: {
        value: '',
        placeholder: 'Enter SoundCloud URL',
    },
};

export const Disabled: Story = {
    args: {
        value: 'https://soundcloud.com/example-mix',
        disabled: true,
    },
};
