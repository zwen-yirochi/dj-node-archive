'use client';

import { PUBLISH_OPTIONS, type PublishOption } from '@/app/dashboard/constants/workflowOptions';
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
import { useEditorData, useEntryMutations } from '../../hooks';
import { toast } from '@/hooks/use-toast';
import { createEmptyEntry } from '@/lib/mappers';
import { draftEventSchema, publishEventSchema } from '@/lib/validations/entry.schemas';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { CreateEventData, EventEntry } from '@/types/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

// 공통 Input 스타일
const inputClassName =
    'border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-dashboard-border-hover focus:ring-1';

export default function CreateEventForm() {
    const form = useForm<CreateEventData>({
        resolver: zodResolver(draftEventSchema),
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

    // TanStack Query
    const { data } = useEditorData();
    const { create: createEntryMutation } = useEntryMutations();

    // Store
    const setView = useDashboardStore((state) => state.setView);
    const closeCreatePanel = useDashboardStore((state) => state.closeCreatePanel);

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

    // 모든 필드 검증 (Publishing용) - Zod 스키마로 검증
    const canPublish = publishEventSchema.safeParse({
        title,
        posterUrl,
        date,
        venue,
        lineup,
        description,
    }).success;

    const canCreate = hasRequiredFields;

    // 취소 핸들러
    const handleCancel = () => {
        reset();
        closeCreatePanel();
    };

    const onSubmit = async (formData: CreateEventData) => {
        clearErrors('root');

        if (!data.pageId) {
            setError('root', { type: 'server', message: 'Page ID is not set. Please refresh.' });
            return;
        }

        if (publishOption === 'publish') {
            const publishResult = publishEventSchema.safeParse(formData);
            if (!publishResult.success) {
                toast({
                    variant: 'destructive',
                    title: 'All fields required',
                    description: 'Publishing requires all fields to be filled.',
                });
                return;
            }
        }

        try {
            const newEntry = createEmptyEntry('event') as EventEntry;
            newEntry.title = formData.title.trim();
            newEntry.posterUrl = formData.posterUrl.trim();
            newEntry.date = formData.date || new Date().toISOString().split('T')[0];
            newEntry.venue = formData.venue;
            newEntry.lineup = formData.lineup;
            newEntry.description = formData.description?.trim() || '';

            await createEntryMutation.mutateAsync({
                pageId: data.pageId,
                entry: newEntry,
                publishOption,
            });
            setView({ kind: 'detail', entryId: newEntry.id });

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
