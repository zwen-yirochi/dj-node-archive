'use client';

import { cn } from '@/lib/utils';

export interface Option<T extends string> {
    id: T;
    label: string;
    description: string;
}

interface OptionSelectorProps<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
}

export default function OptionSelector<T extends string>({
    options,
    value,
    onChange,
}: OptionSelectorProps<T>) {
    return (
        <div className="space-y-2">
            {options.map((option) => {
                const isSelected = value === option.id;

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange(option.id)}
                        className={cn(
                            'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                            isSelected
                                ? 'border-dashboard-text bg-dashboard-bg-active'
                                : 'border-dashboard-border bg-dashboard-bg-muted hover:border-dashboard-border-hover'
                        )}
                    >
                        {/* Radio indicator */}
                        <div
                            className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                isSelected
                                    ? 'border-dashboard-text'
                                    : 'border-dashboard-text-placeholder'
                            )}
                        >
                            {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-dashboard-text" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    isSelected
                                        ? 'text-dashboard-text'
                                        : 'text-dashboard-text-secondary'
                                )}
                            >
                                {option.label}
                            </p>
                            <p className="text-xs text-dashboard-text-muted">
                                {option.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
