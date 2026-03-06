import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import DateField from './DateField';

const meta: Meta<typeof DateField> = {
    title: 'Dashboard/SharedFields/DateField',
    component: DateField,
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
type Story = StoryObj<typeof DateField>;

export const Empty: Story = {
    args: {
        value: '',
    },
};

export const WithDate: Story = {
    args: {
        value: '2026-03-07',
    },
};

export const Disabled: Story = {
    args: {
        value: '2026-03-07',
        disabled: true,
    },
};
