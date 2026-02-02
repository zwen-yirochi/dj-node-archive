'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddButtonProps {
    label: string;
    onClick: () => void;
    className?: string;
}

export default function AddButton({ label, onClick, className }: AddButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80',
                className
            )}
        >
            <Plus className="h-4 w-4" />
            {label}
        </button>
    );
}
