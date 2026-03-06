'use client';

import KeyValueField, { type KeyValueColumn } from '../shared-fields/KeyValueField';
import type { SectionBlockEditorProps } from './types';

const KV_COLUMNS: KeyValueColumn[] = [
    {
        key: 'key',
        placeholder: 'Label',
        width: 'w-28 shrink-0',
        className: 'font-medium text-dashboard-text-secondary',
    },
    { key: 'value', placeholder: 'Value', width: 'flex-1' },
];

const EMPTY_KV = { key: '', value: '' };

export default function KeyValueSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'keyvalue'>) {
    return (
        <KeyValueField
            value={data.items}
            onChange={(items) => onChange({ ...data, items })}
            disabled={disabled}
            columns={KV_COLUMNS}
            emptyItem={EMPTY_KV}
            addLabel="Add field"
        />
    );
}
