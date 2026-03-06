'use client';

import { Loader2 } from 'lucide-react';

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

export default function CreateLinkForm() {
    const { form, canCreate, errors, isSubmitting, handleCancel, handleSubmit } =
        useCreateEntryForm(LINK_FORM_CONFIG);

    const { control } = form;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                                    placeholder="Enter link title"
                                    autoFocus
                                    autoComplete="off"
                                    className={inputClassName}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* URL (Required) */}
                <FormField
                    control={control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-dashboard-text-secondary">
                                URL <span className="text-dashboard-danger">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="https://..."
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
