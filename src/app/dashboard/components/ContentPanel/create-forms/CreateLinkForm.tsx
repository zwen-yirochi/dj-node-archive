'use client';

import { useCallback, useState } from 'react';

import { Globe, Loader2 } from 'lucide-react';

import { LINK_FORM_CONFIG } from '@/app/dashboard/config/entry/entry-forms';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useCreateEntryForm } from '../../../hooks/use-create-entry-form';

const inputClassName =
    'border-dashboard-border bg-dashboard-bg-muted text-dashboard-text placeholder:text-dashboard-text-placeholder focus:border-dashboard-border-hover focus:ring-dashboard-border-hover focus:ring-1';

interface OgData {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
}

async function fetchOgData(url: string): Promise<OgData | null> {
    try {
        const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export default function CreateLinkForm() {
    const { form, canCreate, errors, isSubmitting, handleCancel, handleSubmit } =
        useCreateEntryForm(LINK_FORM_CONFIG);

    const { control, setValue, getValues } = form;
    const [isFetchingOg, setIsFetchingOg] = useState(false);
    const [ogPreview, setOgPreview] = useState<string | null>(null);

    const handleUrlBlur = useCallback(async () => {
        const url = getValues('url');
        if (!url || typeof url !== 'string') return;

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return;
        }

        setIsFetchingOg(true);
        const og = await fetchOgData(url);
        setIsFetchingOg(false);

        if (!og) return;

        // Auto-fill title if empty
        const currentTitle = getValues('title');
        if (!currentTitle && og.title) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue('title' as any, og.title);
        }

        // Auto-fill imageUrls if OG image found
        if (og.imageUrl) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue('imageUrls' as any, [og.imageUrl]);
            setOgPreview(og.imageUrl);
        }
    }, [getValues, setValue]);

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="space-y-6"
            >
                {errors.root && (
                    <div className="rounded-md bg-dashboard-danger-bg p-3 text-sm text-dashboard-danger">
                        {errors.root.message}
                    </div>
                )}

                {/* URL (Required) — first so OG can fill title */}
                <FormField
                    control={control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                URL <span className="text-dashboard-danger">*</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        placeholder="https://..."
                                        autoFocus
                                        autoComplete="off"
                                        className={inputClassName}
                                        onBlur={(e) => {
                                            field.onBlur();
                                            handleUrlBlur();
                                        }}
                                    />
                                    {isFetchingOg && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-dashboard-text-placeholder" />
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* OG Preview */}
                {ogPreview && (
                    <div className="flex items-center gap-3 rounded-md border border-dashboard-border bg-dashboard-bg-muted p-2">
                        <img
                            src={ogPreview}
                            alt=""
                            className="h-12 w-16 flex-shrink-0 rounded border border-dashboard-border object-cover"
                            onError={() => setOgPreview(null)}
                        />
                        <div className="flex items-center gap-1.5 text-xs text-dashboard-text-muted">
                            <Globe className="h-3 w-3" />
                            Thumbnail detected
                        </div>
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
                                    placeholder="Enter link title"
                                    autoComplete="off"
                                    className={inputClassName}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                        Create Link
                    </Button>
                </div>
            </form>
        </Form>
    );
}
