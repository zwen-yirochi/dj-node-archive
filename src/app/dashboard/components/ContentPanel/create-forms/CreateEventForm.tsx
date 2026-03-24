'use client';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { EVENT_FORM_CONFIG } from '@/app/dashboard/config/entry/entry-forms';
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
import SearchableTagInput from '@/components/ui/SearchableTagInput';
import { Textarea } from '@/components/ui/textarea';

import { useCreateEntryForm } from '../../../hooks/use-create-entry-form';
import { PUBLISH_OPTIONS } from './workflow-options';

// Common Input styles
const inputClassName =
    'border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-dashboard-border-hover focus:ring-1';

export default function CreateEventForm() {
    const {
        form,
        publishOption,
        canCreate,
        errors,
        isSubmitting,
        handleCancel,
        handlePublishOptionChange,
        handleSubmit,
    } = useCreateEntryForm(EVENT_FORM_CONFIG);

    const { control } = form;

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="space-y-6"
            >
                {/* Root error display */}
                {errors.root && (
                    <div className="rounded-md bg-dashboard-danger-bg p-3 text-sm text-dashboard-danger">
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
                                Title <span className="text-dashboard-danger">*</span>
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
                    name="imageUrls"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                Poster <span className="text-dashboard-danger">*</span>
                            </FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value?.[0] || ''}
                                    onChange={(url) => field.onChange(url ? [url] : [])}
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
                                <SearchableTagInput
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
                                    className={cn(inputClassName, 'resize-none')}
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
                        options={PUBLISH_OPTIONS}
                        value={publishOption!}
                        onChange={handlePublishOptionChange!}
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
