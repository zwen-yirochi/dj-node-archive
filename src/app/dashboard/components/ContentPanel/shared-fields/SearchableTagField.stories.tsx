import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import type { TagOption } from '@/components/ui/SearchableTagInput';

import SearchableTagField from './SearchableTagField';

const mockSearchArtists = async (query: string): Promise<TagOption[]> => {
    const artists = [
        { id: '1', name: 'Aphex Twin', subtitle: 'Artist reference' },
        { id: '2', name: 'Autechre', subtitle: 'Artist reference' },
        { id: '3', name: 'Boards of Canada', subtitle: 'Artist reference' },
        { id: '4', name: 'Burial', subtitle: 'Artist reference' },
        { id: '5', name: 'Flying Lotus', subtitle: 'Artist reference' },
    ];
    await new Promise((r) => setTimeout(r, 300));
    return artists.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
};

const mockSearchGenres = async (query: string): Promise<TagOption[]> => {
    const genres = [
        { id: 'g1', name: 'Techno' },
        { id: 'g2', name: 'House' },
        { id: 'g3', name: 'Ambient' },
        { id: 'g4', name: 'Drum and Bass' },
        { id: 'g5', name: 'IDM' },
    ];
    await new Promise((r) => setTimeout(r, 300));
    return genres.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));
};

const meta: Meta<typeof SearchableTagField> = {
    title: 'Dashboard/SharedFields/SearchableTagField',
    component: SearchableTagField,
    decorators: [
        (Story) => (
            <div className="w-96 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof SearchableTagField>;

export const Empty: Story = {
    args: {
        value: [],
        searchFn: mockSearchArtists,
        placeholder: 'Search artists...',
    },
};

export const WithTags: Story = {
    args: {
        value: [
            { id: '1', name: 'Aphex Twin' },
            { id: '3', name: 'Boards of Canada' },
        ],
        searchFn: mockSearchArtists,
        placeholder: 'Search artists...',
    },
};

export const GenreSearch: Story = {
    args: {
        value: [{ id: 'g1', name: 'Techno' }],
        searchFn: mockSearchGenres,
        placeholder: 'Search genres...',
    },
};
