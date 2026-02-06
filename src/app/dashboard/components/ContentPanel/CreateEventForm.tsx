'use client';

import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ui/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';
import SearchableInput, { type SearchOption } from '@/components/ui/SearchableInput';
import TagSearchInput, { type TagOption } from '@/components/ui/TagSearchInput';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { useUIStore } from '@/stores/uiStore';
import type { EventEntry } from '@/types/domain';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

// 생성 옵션 타입
type PublishOption = 'publish' | 'private';

const PUBLISH_OPTIONS = [
    {
        id: 'publish' as const,
        label: 'Publish',
        description: 'Visible to everyone. Requires all fields.',
    },
    {
        id: 'private' as const,
        label: 'Private',
        description: 'Only visible to you. Requires title and poster.',
    },
];

interface EventFormData {
    title: string;
    posterUrl: string;
    date: string;
    venue: { id?: string; name: string };
    lineup: { id?: string; name: string }[];
    description: string;
}

const initialFormData: EventFormData = {
    title: '',
    posterUrl: '',
    date: '',
    venue: { name: '' },
    lineup: [],
    description: '',
};

// API 검색 함수
async function searchVenues(query: string): Promise<SearchOption[]> {
    try {
        const res = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}&limit=10`);
        if (!res.ok) return [];
        const json = await res.json();
        const venues = json.data || [];
        return venues.map((v: { id: string; name: string; city?: string }) => ({
            id: v.id,
            name: v.name,
            subtitle: v.city || undefined,
        }));
    } catch {
        return [];
    }
}

async function searchArtists(query: string): Promise<TagOption[]> {
    try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(query)}&type=all`);
        if (!res.ok) return [];
        const data = await res.json();
        // API returns { users: [], artists: [] }
        const results: TagOption[] = [];
        if (data.users) {
            results.push(
                ...data.users.map((u: { id: string; display_name: string; username: string }) => ({
                    id: u.id,
                    name: u.display_name || u.username,
                    subtitle: 'Platform user',
                }))
            );
        }
        if (data.artists) {
            results.push(
                ...data.artists.map((a: { id: string; name: string }) => ({
                    id: a.id,
                    name: a.name,
                    subtitle: 'Artist reference',
                }))
            );
        }
        return results;
    } catch {
        return [];
    }
}

export default function CreateEventForm() {
    const [formData, setFormData] = useState<EventFormData>(initialFormData);
    const [publishOption, setPublishOption] = useState<PublishOption>('private');
    const [isSaving, setIsSaving] = useState(false);

    // Stores
    const createEntry = useContentEntryStore((state) => state.createEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);
    const closeCreatePanel = useUIStore((state) => state.closeCreatePanel);
    const selectEntry = useUIStore((state) => state.selectEntry);

    // 필수 필드 검증
    const hasRequiredFields = formData.title.trim() && formData.posterUrl.trim();

    // 모든 필드 검증 (Publishing용)
    const hasAllFields =
        hasRequiredFields &&
        formData.date &&
        formData.venue.name.trim() &&
        formData.lineup.length > 0 &&
        formData.description.trim();

    // 생성 버튼 활성화 조건
    const canCreate = hasRequiredFields;

    // Publishing 옵션 활성화 조건
    const canPublish = hasAllFields;

    const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        if (!canCreate) return;

        // Publishing 선택했는데 모든 필드가 안 채워진 경우
        if (publishOption === 'publish' && !canPublish) {
            toast({
                variant: 'destructive',
                title: 'All fields required',
                description: 'Publishing requires all fields to be filled.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const newEntry = createEmptyEntry('event') as EventEntry;
            newEntry.title = formData.title.trim();
            newEntry.posterUrl = formData.posterUrl.trim();
            newEntry.date = formData.date || new Date().toISOString().split('T')[0];
            newEntry.venue = formData.venue;
            newEntry.lineup = formData.lineup;
            newEntry.description = formData.description.trim();

            await createEntry(newEntry);
            finishCreatingEntry(newEntry.id);
            triggerPreviewRefresh();
            closeCreatePanel();
            selectEntry(newEntry.id);

            toast({
                title: 'Event created',
                description:
                    publishOption === 'publish' ? 'Event published.' : 'Event saved as private.',
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Creation failed',
                description: 'An error occurred while creating the event.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Title (Required) */}
            <div className="space-y-2">
                <Label htmlFor="event-title" className="text-dashboard-text-secondary">
                    Title <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="event-title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter event title"
                    autoFocus
                    className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                />
            </div>

            {/* Poster Upload (Required) */}
            <div className="space-y-2">
                <Label className="text-dashboard-text-secondary">
                    Poster <span className="text-red-500">*</span>
                </Label>
                <ImageUpload
                    value={formData.posterUrl}
                    onChange={(url) => updateField('posterUrl', url)}
                    aspectRatio="poster"
                />
            </div>

            {/* Date */}
            <div className="space-y-2">
                <Label htmlFor="event-date" className="text-dashboard-text-secondary">
                    Date
                </Label>
                <Input
                    id="event-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="border-dashboard-border bg-dashboard-bg-muted text-dashboard-text focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                />
            </div>

            {/* Venue */}
            <div className="space-y-2">
                <Label className="text-dashboard-text-secondary">Venue</Label>
                <SearchableInput
                    value={formData.venue}
                    onChange={(venue) => updateField('venue', venue)}
                    searchFn={searchVenues}
                    placeholder="Search or enter venue name"
                />
            </div>

            {/* Lineup */}
            <div className="space-y-2">
                <Label className="text-dashboard-text-secondary">Lineup</Label>
                <TagSearchInput
                    value={formData.lineup}
                    onChange={(lineup) => updateField('lineup', lineup)}
                    searchFn={searchArtists}
                    placeholder="Search or add artists"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="event-description" className="text-dashboard-text-secondary">
                    Description
                </Label>
                <Textarea
                    id="event-description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Enter event description"
                    rows={4}
                    className="resize-none border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-1 focus:ring-dashboard-border-hover"
                />
            </div>

            {/* Publish Option */}
            <div className="space-y-2">
                <Label className="text-dashboard-text-secondary">Visibility</Label>
                <OptionSelector
                    options={PUBLISH_OPTIONS.map((opt) => ({
                        ...opt,
                        description:
                            opt.id === 'publish' && !canPublish
                                ? 'Fill all fields to enable publishing'
                                : opt.description,
                    }))}
                    value={publishOption}
                    onChange={(value) => {
                        if (value === 'publish' && !canPublish) {
                            toast({
                                variant: 'destructive',
                                title: 'Cannot publish',
                                description: 'All fields must be filled to publish.',
                            });
                            return;
                        }
                        setPublishOption(value);
                    }}
                />
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleCreate}
                    disabled={!canCreate || isSaving}
                    className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Event
                </Button>
            </div>
        </div>
    );
}
