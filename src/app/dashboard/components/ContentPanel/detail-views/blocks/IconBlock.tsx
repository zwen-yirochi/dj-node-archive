'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import IconField from '../../shared-fields/IconField';
import type { FieldBlockProps } from '../types';

const ICON_CONFIG: FieldSyncConfig<string> = { immediate: true };

export default function IconBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const icon = entry.type === 'link' ? entry.icon || '' : '';

    return (
        <FieldSync config={ICON_CONFIG} value={icon} onSave={(v) => onSave('icon', v)}>
            {({ value, onChange }) => (
                <IconField value={value} onChange={onChange} disabled={disabled} />
            )}
        </FieldSync>
    );
}
