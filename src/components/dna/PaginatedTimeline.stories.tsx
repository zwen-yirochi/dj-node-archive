import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import PaginatedTimeline from './PaginatedTimeline';

const meta: Meta<typeof PaginatedTimeline> = {
    title: 'DNA/Data Display/PaginatedTimeline',
    component: PaginatedTimeline,
};

export default meta;
type Story = StoryObj<typeof PaginatedTimeline>;

const manyEntries = Array.from({ length: 12 }, (_, i) => ({
    date: `${String(12 - i).padStart(2, '0')} DEC 2024`,
    title: `EVENT #${12 - i}`,
    venue: i % 2 === 0 ? 'Cakeshop' : 'Faust',
}));

export const Default: Story = {
    args: {
        entries: manyEntries,
    },
};

export const FewEntries: Story = {
    args: {
        entries: [
            { date: '15 DEC 2024', title: 'NOCTURNAL FREQUENCIES', venue: 'Cakeshop' },
            { date: '08 NOV 2024', title: 'DEEP STATE', venue: 'Faust' },
        ],
    },
};

export const ExactlyPageSize: Story = {
    args: {
        entries: manyEntries.slice(0, 5),
    },
};
