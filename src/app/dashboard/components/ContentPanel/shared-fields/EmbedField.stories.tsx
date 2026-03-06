import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import EmbedField from './EmbedField';

const meta: Meta<typeof EmbedField> = {
    title: 'Dashboard/SharedFields/EmbedField',
    component: EmbedField,
    decorators: [
        (Story) => (
            <div className="w-[480px] rounded-lg border border-dashboard-border bg-dashboard-bg-card p-6">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EmbedField>;

export const Empty: Story = {
    args: {
        value: '',
    },
};

export const YouTube: Story = {
    args: {
        value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
};

export const SoundCloudTrack: Story = {
    args: {
        value: 'https://soundcloud.com/flaboradio/flabo-radio-ep14',
    },
};

export const SoundCloudProfile: Story = {
    args: {
        value: 'https://soundcloud.com/ffan',
    },
};

export const UnsupportedURL: Story = {
    args: {
        value: 'https://example.com/some-page',
    },
};

export const Disabled: Story = {
    args: {
        value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        disabled: true,
    },
};
