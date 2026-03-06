/**
 * Entry creation form factory hook
 *
 * Extracts shared logic for Event/Mixset/Link creation forms:
 * - useForm + zodResolver (static or dynamic)
 * - publishOption state management (when publishable is enabled)
 * - canCreate determination (based on draftSchema.safeParse)
 * - onSubmit: verify pageId -> toEntry -> mutate -> toast
 * - Server error -> form field mapping
 *
 * schemas, label, canCreate are derived from the existing config system:
 * - ENTRY_SCHEMAS[type] -> draftSchema / publishSchema
 * - ENTRY_TYPE_CONFIG[type] -> label
 * - draftSchema.safeParse -> canCreate
 */

import { useRef, useState } from 'react';

import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type { ContentEntry } from '@/types/domain';
import { toast } from '@/hooks/use-toast';

import { useEntryMutations } from '.';
import { type PublishOption } from '../components/ContentPanel/create-forms/workflow-options';
import { ENTRY_TYPE_CONFIG, type EntryType } from '../config/entry/entry-types';
import { ENTRY_SCHEMAS } from '../config/entry/entry-validation';
import { selectPageId, selectSetView, useDashboardStore } from '../stores/dashboardStore';

// ── Config ──────────────────────────────────
export interface CreateEntryFormConfig<T extends FieldValues> {
    /** Entry type — schemas, label, canCreate are derived from existing config */
    type: EntryType;
    /** Whether to enable publish/private toggle UI (default: false) */
    publishable?: boolean;
    defaultValues: DefaultValues<T>;
    /** Convert formData to ContentEntry */
    toEntry: (formData: T) => ContentEntry;
    /** Server error message keyword -> form field mapping (e.g. { poster: 'posterUrl' }) */
    errorFieldMap?: Record<string, Path<T>>;
}

export function useCreateEntryForm<T extends FieldValues>(config: CreateEntryFormConfig<T>) {
    const { type, publishable = false, defaultValues, toEntry, errorFieldMap = {} } = config;

    // ── Derived from existing config system ──
    const { create: draftSchema, view: publishSchema } = ENTRY_SCHEMAS[type];
    const { label } = ENTRY_TYPE_CONFIG[type];
    const hasPublishOption = publishable;

    // ── Publish Option ──
    const [publishOption, setPublishOption] = useState<PublishOption>('private');
    const publishOptionRef = useRef(publishOption);
    publishOptionRef.current = publishOption;

    // ── Form ──
    const form = useForm<T>({
        resolver: hasPublishOption
            ? (values, context, options) => {
                  const schema =
                      publishOptionRef.current === 'publish' ? publishSchema : draftSchema;
                  return zodResolver(schema)(values, context, options);
              }
            : zodResolver(draftSchema),
        mode: 'onTouched',
        defaultValues,
    });

    const {
        handleSubmit,
        watch,
        reset,
        setError,
        clearErrors,
        trigger,
        formState: { errors, isSubmitting },
    } = form;

    // ── External dependencies ──
    const pageId = useDashboardStore(selectPageId);
    const { create: createEntryMutation } = useEntryMutations();
    const setView = useDashboardStore(selectSetView);

    // ── canCreate: draftSchema is the single source of truth ──
    const formValues = watch();
    const canCreate = draftSchema.safeParse(formValues).success;

    // ── Cancel ──
    const handleCancel = () => {
        reset();
        if (hasPublishOption) setPublishOption('private');
        setView({ kind: 'page' });
    };

    // ── Publish Option Change ──
    const handlePublishOptionChange = hasPublishOption
        ? (value: PublishOption) => {
              if (value === 'publish') {
                  const result = publishSchema.safeParse(form.getValues());
                  if (!result.success) {
                      toast({
                          variant: 'destructive',
                          title: 'Cannot publish',
                          description: 'All fields must be filled to publish.',
                      });
                      return;
                  }
              }
              setPublishOption(value);
              trigger();
          }
        : undefined;

    // ── Submit ──
    const onSubmit = async (formData: T) => {
        clearErrors('root');

        if (!pageId) {
            setError('root', { type: 'server', message: 'Page ID is not set. Please refresh.' });
            return;
        }

        try {
            const newEntry = toEntry(formData);

            await createEntryMutation.mutateAsync({
                pageId,
                entry: newEntry,
                ...(hasPublishOption ? { publishOption } : {}),
            });
            setView({ kind: 'detail', entryId: newEntry.id });

            const description = hasPublishOption
                ? publishOption === 'publish'
                    ? `${label} published.`
                    : `${label} saved as private.`
                : `${label} has been saved.`;
            toast({ title: `${label} created`, description });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';

            const matchedEntry = Object.entries(errorFieldMap).find(([keyword]) =>
                message.includes(keyword)
            );

            if (matchedEntry) {
                setError(matchedEntry[1] as Path<T>, { type: 'server', message });
            } else {
                setError('root', { type: 'server', message });
                toast({ variant: 'destructive', title: 'Creation failed', description: message });
            }
        }
    };

    return {
        form,
        publishOption: hasPublishOption ? publishOption : null,
        canCreate,
        errors,
        isSubmitting,
        handleCancel,
        handlePublishOptionChange,
        handleSubmit: handleSubmit(onSubmit),
    };
}
