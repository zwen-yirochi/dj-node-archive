'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import LinkField from '../../shared-fields/LinkField';
import type { FieldBlockProps } from '../types';

const URL_CONFIG: FieldSyncConfig<string> = { immediate: true };

export default function UrlBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const url = 'url' in entry ? (entry.url as string) || '' : '';

    return (
        <FieldSync config={URL_CONFIG} value={url} onSave={(v) => onSave('url', v)}>
            {({ value, onChange }) => (
                <LinkField value={value} onChange={onChange} disabled={disabled} />
            )}
        </FieldSync>
    );
}
