'use client';

import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { SectionBlockEditorProps } from './types';

export default function ListSection({ data, onChange, disabled }: SectionBlockEditorProps<'list'>) {
    const items = data.items;

    const updateItem = (index: number, value: string) => {
        const updated = items.map((item, i) => (i === index ? value : item));
        onChange({ ...data, items: updated });
    };

    const addItem = () => {
        onChange({ ...data, items: [...items, ''] });
    };

    const removeItem = (index: number) => {
        onChange({ ...data, items: items.filter((_, i) => i !== index) });
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addItem();
        }
        if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
            e.preventDefault();
            removeItem(index);
        }
    };

    return (
        <div className="space-y-1">
            {items.map((item, index) => (
                <div key={index} className="group flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-dashboard-text-placeholder">
                        {data.style === 'numbered' ? `${index + 1}.` : '\u2022'}
                    </span>
                    <Input
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="List item"
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
                    className="ml-5 h-7 gap-1 text-xs text-dashboard-text-muted hover:text-dashboard-text"
                >
                    <Plus className="h-3 w-3" />
                    Add item
                </Button>
            )}
        </div>
    );
}
