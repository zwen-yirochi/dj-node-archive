'use client';

import { useImmediateSave } from '@/app/dashboard/hooks/use-immediate-save';

import { EditFieldWrapper, ImageField } from '../shared-fields';
import type { EditFieldConfig } from '../shared-fields/EditFieldWrapper';
import type { ImageFieldValue } from '../shared-fields/types';
import type { SectionBlockEditorProps } from './types';

const IMAGE_EDIT_CONFIG: EditFieldConfig<ImageFieldValue> = {
    useSave: useImmediateSave,
};

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    const handleSave = (value: ImageFieldValue) => {
        onChange({ url: value.url, alt: value.alt, caption: value.caption });
    };

    return (
        <EditFieldWrapper config={IMAGE_EDIT_CONFIG} value={data} onSave={handleSave}>
            {({ value, onChange: onFieldChange }) => (
                <ImageField value={value} onChange={onFieldChange} disabled={disabled} />
            )}
        </EditFieldWrapper>
    );
}
