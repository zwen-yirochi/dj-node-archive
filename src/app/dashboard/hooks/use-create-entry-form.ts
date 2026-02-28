/**
 * 엔트리 생성 폼 팩토리 훅
 *
 * Event/Mixset/Link 생성 폼의 공통 로직을 추출:
 * - useForm + zodResolver (고정 or 동적)
 * - publishOption 상태 관리 (publishable 설정 시)
 * - canCreate 판정 (draftSchema.safeParse 기반)
 * - onSubmit: pageId 확인 → toEntry → mutate → toast
 * - 서버 에러 → 폼 필드 매핑
 *
 * schemas, label, canCreate는 기존 config 체계에서 파생:
 * - ENTRY_SCHEMAS[type] → draftSchema / publishSchema
 * - ENTRY_TYPE_CONFIG[type] → label
 * - draftSchema.safeParse → canCreate
 */

import { useRef, useState } from 'react';

import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type { ContentEntry } from '@/types/domain';
import { toast } from '@/hooks/use-toast';
import { type PublishOption } from '@/app/dashboard/config/workflowOptions';

import { useEntryMutations } from '.';
import { ENTRY_TYPE_CONFIG, type EntryType } from '../config/entryConfig';
import { ENTRY_SCHEMAS } from '../config/entryFieldConfig';
import { selectPageId, selectSetView, useDashboardStore } from '../stores/dashboardStore';

// ── Config ──────────────────────────────────
export interface CreateEntryFormConfig<T extends FieldValues> {
    /** 엔트리 타입 — schemas, label, canCreate를 기존 config에서 파생 */
    type: EntryType;
    /** publish/private 토글 UI 활성화 여부 (기본: false) */
    publishable?: boolean;
    defaultValues: DefaultValues<T>;
    /** formData → ContentEntry 변환 */
    toEntry: (formData: T) => ContentEntry;
    /** 서버 에러 메시지의 키워드 → 폼 필드 매핑 (e.g. { poster: 'posterUrl' }) */
    errorFieldMap?: Record<string, Path<T>>;
}

export function useCreateEntryForm<T extends FieldValues>(config: CreateEntryFormConfig<T>) {
    const { type, publishable = false, defaultValues, toEntry, errorFieldMap = {} } = config;

    // ── 기존 config 체계에서 파생 ──
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

    // ── 외부 의존성 ──
    const pageId = useDashboardStore(selectPageId);
    const { create: createEntryMutation } = useEntryMutations();
    const setView = useDashboardStore(selectSetView);

    // ── canCreate: draftSchema가 단일 판정 소스 ──
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
