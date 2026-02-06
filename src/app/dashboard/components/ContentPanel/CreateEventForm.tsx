'use client';

import {
    EVENT_VALIDATION_RULES,
    PUBLISH_OPTIONS,
    type EventFormData,
    type PublishOption,
} from '@/app/dashboard/constants/entry';
import { searchArtists, searchVenues } from '@/app/dashboard/services/search';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import ImageUpload from '@/components/ui/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';
import SearchableInput from '@/components/ui/SearchableInput';
import TagSearchInput from '@/components/ui/TagSearchInput';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useDisplayEntryStore } from '@/stores/displayEntryStore';
import { useUIStore } from '@/stores/uiStore';
import type { EventEntry } from '@/types/domain';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

// 공통 Input 스타일
const inputClassName =
    'border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-dashboard-border-hover focus:ring-1';

export default function CreateEventForm() {
    const form = useForm<EventFormData>({
        mode: 'onTouched',
        defaultValues: {
            title: '',
            posterUrl: '',
            date: '',
            venue: { name: '' },
            lineup: [],
            description: '',
        },
    });

    const {
        control,
        handleSubmit,
        watch,
        reset,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = form;

    const [publishOption, setPublishOption] = useState<PublishOption>('private');

    // Stores
    const createEntry = useContentEntryStore((state) => state.createEntry);
    const finishCreatingEntry = useContentEntryStore((state) => state.finishCreating);
    const triggerPreviewRefresh = useDisplayEntryStore((state) => state.triggerPreviewRefresh);
    const closeCreatePanel = useUIStore((state) => state.closeCreatePanel);
    const selectEntry = useUIStore((state) => state.selectEntry);

    // watch 최적화: 필요한 필드만 구독
    const [title, posterUrl, date, venue, lineup, description] = watch([
        'title',
        'posterUrl',
        'date',
        'venue',
        'lineup',
        'description',
    ]);

    // 필수 필드 검증
    const hasRequiredFields = title?.trim() && posterUrl?.trim();

    // 모든 필드 검증 (Publishing용)
    const hasAllFields =
        hasRequiredFields &&
        date &&
        venue?.name?.trim() &&
        lineup?.length > 0 &&
        description?.trim();

    // 생성 버튼 활성화 조건
    const canCreate = hasRequiredFields;

    // Publishing 옵션 활성화 조건
    const canPublish = hasAllFields;

    // 취소 핸들러
    const handleCancel = () => {
        reset();
        closeCreatePanel();
    };

    const onSubmit = async (data: EventFormData) => {
        // 기존 서버 에러 클리어
        clearErrors('root');

        if (publishOption === 'publish' && !canPublish) {
            toast({
                variant: 'destructive',
                title: 'All fields required',
                description: 'Publishing requires all fields to be filled.',
            });
            return;
        }

        try {
            const newEntry = createEmptyEntry('event') as EventEntry;
            newEntry.title = data.title.trim();
            newEntry.posterUrl = data.posterUrl.trim();
            newEntry.date = data.date || new Date().toISOString().split('T')[0];
            newEntry.venue = data.venue;
            newEntry.lineup = data.lineup;
            newEntry.description = data.description.trim();

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
        } catch (error) {
            // 서버 에러를 폼에 표시
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';

            // 특정 필드 에러인 경우 해당 필드에 표시
            if (message.includes('title')) {
                setError('title', { type: 'server', message });
            } else if (message.includes('poster')) {
                setError('posterUrl', { type: 'server', message });
            } else {
                // 일반 에러는 root에 설정
                setError('root', { type: 'server', message });
                toast({
                    variant: 'destructive',
                    title: 'Creation failed',
                    description: message,
                });
            }
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Root 에러 표시 */}
                {errors.root && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {errors.root.message}
                    </div>
                )}

                {/* Title (Required) */}
                <FormField
                    control={control}
                    name="title"
                    rules={EVENT_VALIDATION_RULES.title}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                Title <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter event title"
                                    autoFocus
                                    autoComplete="off"
                                    className={inputClassName}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Poster Upload (Required) */}
                <FormField
                    control={control}
                    name="posterUrl"
                    rules={EVENT_VALIDATION_RULES.posterUrl}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                Poster <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    aspectRatio="poster"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Date */}
                <FormField
                    control={control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">Date</FormLabel>
                            <FormControl>
                                <Input {...field} type="date" className={inputClassName} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Venue */}
                <FormField
                    control={control}
                    name="venue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">Venue</FormLabel>
                            <FormControl>
                                <SearchableInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    searchFn={searchVenues}
                                    placeholder="Search or enter venue name"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Lineup */}
                <FormField
                    control={control}
                    name="lineup"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">Lineup</FormLabel>
                            <FormControl>
                                <TagSearchInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    searchFn={searchArtists}
                                    placeholder="Search or add artists"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                Description
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Enter event description"
                                    rows={4}
                                    className={`${inputClassName} resize-none`}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                        className="text-dashboard-text-secondary hover:bg-dashboard-bg-muted hover:text-dashboard-text"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!canCreate || isSubmitting}
                        className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Event
                    </Button>
                </div>
            </form>
        </Form>
    );
}
