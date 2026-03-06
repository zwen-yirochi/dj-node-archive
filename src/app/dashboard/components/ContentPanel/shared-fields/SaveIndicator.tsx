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

    if (!visible) return <span className="inline-block h-3 w-3 shrink-0" />;

    if (status === 'saving') {
        return (
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />
        );
    }

    if (status === 'saved') {
        return (
            <Check className="h-3 w-3 shrink-0 text-green-500 duration-200 animate-in fade-in" />
        );
    }

    if (status === 'error') {
        return <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />;
    }

    return null;
}
