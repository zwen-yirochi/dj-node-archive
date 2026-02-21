import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MetaTable } from './MetaTable';

const meta: Meta<typeof MetaTable> = {
    title: 'DNA/Data Display/MetaTable',
    component: MetaTable,
};

export default meta;
type Story = StoryObj<typeof MetaTable>;

export const Default: Story = {
    args: {
        items: [
            { key: 'Location', value: 'Seoul, South Korea' },
            { key: 'Capacity', value: '350' },
            { key: 'Genre', value: 'Techno / House / Ambient' },
            { key: 'Founded', value: '2019' },
        ],
    },
};
