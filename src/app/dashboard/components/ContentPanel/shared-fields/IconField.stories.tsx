import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import IconField from './IconField';

const meta: Meta<typeof IconField> = {
    title: 'Dashboard/SharedFields/IconField',
    component: IconField,
    decorators: [
        (Story) => (
            <div className="w-80 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-6">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof IconField>;

export const Default: Story = {
    args: {
        value: 'globe',
    },
};

export const Soundcloud: Story = {
    args: {
        value: 'soundcloud',
    },
};

export const Instagram: Story = {
    args: {
        value: 'instagram',
    },
};

export const Empty: Story = {
    args: {
        value: '',
    },
};

export const Disabled: Story = {
    args: {
        value: 'spotify',
        disabled: true,
    },
};
