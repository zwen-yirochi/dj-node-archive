'use client';

import { useEffect, useRef, useState } from 'react';

import { Globe, Instagram, Mail, Music, Youtube } from 'lucide-react';

import { ICON_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';

import type { FieldComponentProps } from './types';

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
};

export default function IconField({ value = '', onChange, disabled }: FieldComponentProps<string>) {
    const [showSelector, setShowSelector] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const IconComponent = iconComponents[value] || Globe;

    useEffect(() => {
        if (!showSelector) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSelector]);

    return (
        <div ref={popoverRef} className="relative w-9 overflow-visible">
            <button
                onClick={() => !disabled && setShowSelector(!showSelector)}
                disabled={disabled}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-dashboard-bg-muted transition-colors hover:bg-dashboard-bg-hover"
                title="Click to change icon"
            >
                <IconComponent className="h-5 w-5 text-dashboard-text-secondary" />
            </button>
            {showSelector && (
                <div className="absolute left-0 top-full z-50 mt-1 w-max rounded-xl border border-dashboard-border bg-dashboard-bg-card p-2 shadow-lg">
                    <div className="grid grid-cols-4 gap-1">
                        {ICON_OPTIONS.map((opt) => {
                            const Icon = iconComponents[opt] || Globe;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onChange?.(opt);
                                        setShowSelector(false);
                                    }}
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                        value === opt
                                            ? 'bg-dashboard-bg-muted text-dashboard-text'
                                            : 'text-dashboard-text-muted hover:bg-dashboard-bg-hover hover:text-dashboard-text'
                                    )}
                                    title={opt}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
