'use client';

import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';

import type { SaveStatus } from '@/app/dashboard/hooks/use-field-sync';

interface SaveIndicatorProps {
    status: SaveStatus;
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (status === 'saving' || status === 'error') {
            setVisible(true);
        } else if (status === 'saved') {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [status]);

    return (
        <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center">
            {visible && status === 'saving' && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            )}
            {visible && status === 'saved' && (
                <Check className="h-3 w-3 text-green-500 duration-200 animate-in fade-in" />
            )}
            {visible && status === 'error' && <span className="h-2 w-2 rounded-full bg-red-500" />}
        </span>
    );
}
