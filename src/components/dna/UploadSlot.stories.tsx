import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { UploadSlot } from './UploadSlot';

const meta: Meta<typeof UploadSlot> = {
    title: 'DNA/Input/UploadSlot',
    component: UploadSlot,
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 400 }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof UploadSlot>;

export const Default: Story = {};
