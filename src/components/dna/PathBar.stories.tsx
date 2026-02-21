import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PathBar } from './PathBar';

const meta: Meta<typeof PathBar> = {
    title: 'DNA/Texture/PathBar',
    component: PathBar,
};

export default meta;
type Story = StoryObj<typeof PathBar>;

export const Default: Story = {
    args: {
        path: 'CTX://EVENTS/2024',
    },
};

export const WithMeta: Story = {
    args: {
        path: 'CTX://VENUE/VN-A3F2',
        meta: '12 EVENTS',
    },
};
