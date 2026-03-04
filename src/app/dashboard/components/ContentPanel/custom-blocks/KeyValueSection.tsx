'use client';

import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { SectionBlockEditorProps } from './types';

export default function KeyValueSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'keyvalue'>) {
    const items = data.items;

    const updateItem = (index: number, field: 'key' | 'value', val: string) => {
        const updated = items.map((item, i) => (i === index ? { ...item, [field]: val } : item));
        onChange({ ...data, items: updated });
    };

    const addItem = () => {
        onChange({ ...data, items: [...items, { key: '', value: '' }] });
    };

    const removeItem = (index: number) => {
        onChange({ ...data, items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-1.5">
            {items.map((item, index) => (
                <div key={index} className="group flex items-center gap-2">
                    <Input
                        value={item.key}
                        onChange={(e) => updateItem(index, 'key', e.target.value)}
                        placeholder="Label"
                        disabled={disabled}
                        className="w-28 shrink-0 border-none bg-transparent p-0 text-sm font-medium text-dashboard-text-secondary placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
                    />
                    <span className="text-dashboard-text-placeholder">:</span>
                    <Input
                        value={item.value}
                        onChange={(e) => updateItem(index, 'value', e.target.value)}
                        placeholder="Value"
                        disabled={disabled}
                        className="flex-1 border-none bg-transparent p-0 text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
                    />
                    {!disabled && items.length > 1 && (
                        <button
                            onClick={() => removeItem(index)}
                            className="rounded p-0.5 opacity-0 transition-opacity hover:bg-dashboard-bg-muted group-hover:opacity-100"
                        >
                            <X className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        </button>
                    )}
                </div>
            ))}
            {!disabled && (
                <Button
                    onClick={addItem}
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-dashboard-text-muted hover:text-dashboard-text"
                >
                    <Plus className="h-3 w-3" />
                    Add field
                </Button>
            )}
        </div>
    );
}
