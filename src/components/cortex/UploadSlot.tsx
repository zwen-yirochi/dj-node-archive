'use client';

import { cn } from '@/lib/utils';

interface UploadSlotProps {
    label?: string;
    sublabel?: string;
    hint?: string;
    onFileSelect?: (file: File) => void;
    className?: string;
}

export function UploadSlot({
    label = 'Upload Image Fragment',
    sublabel = 'Auto-processed: DUOTONE.V3 + GRAIN',
    hint = 'JPG, PNG, WEBP // Max 10MB',
    onFileSelect,
    className,
}: UploadSlotProps) {
    return (
        <div className={cn('mb-3.5', className)}>
            <div
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) onFileSelect?.(file);
                    };
                    input.click();
                }}
                className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-cortex-ink-ghost bg-white/20 hover:border-cortex-ink-mid hover:bg-white/40"
            >
                <div className="font-mono-main text-xl text-cortex-ink-ghost">[+]</div>
                <div className="text-cortex-label uppercase tracking-cortex-meta text-cortex-ink-light">
                    {label}
                </div>
                <div className="text-cortex-system text-cortex-ink-ghost">{sublabel}</div>
            </div>
            {hint && <div className="mt-1 text-cortex-label text-cortex-ink-ghost">{hint}</div>}
        </div>
    );
}
