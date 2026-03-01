'use client';

import { useEffect, useRef, useState } from 'react';

import { Globe, Instagram, Mail, Music, Youtube } from 'lucide-react';

import { ICON_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';

import type { FieldBlockProps } from '../types';

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

export default function IconBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const [showSelector, setShowSelector] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const icon = entry.type === 'link' ? entry.icon || '' : '';
    const IconComponent = iconComponents[icon] || Globe;

    // Close popup on outside click
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
        <div ref={popoverRef} className="relative mx-auto w-fit">
            <button
                onClick={() => !disabled && setShowSelector(!showSelector)}
                disabled={disabled}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted transition-colors hover:bg-dashboard-bg-hover"
                title="Click to change icon"
            >
                <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
            </button>
            {showSelector && (
                <div className="absolute left-1/2 z-10 mt-2 -translate-x-1/2 rounded-xl border border-dashboard-border bg-dashboard-bg-card p-3 shadow-lg">
                    <div className="grid grid-cols-4 gap-2">
                        {ICON_OPTIONS.map((opt) => {
                            const Icon = iconComponents[opt] || Globe;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onSave('icon', opt);
                                        setShowSelector(false);
                                    }}
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
                                        icon === opt
                                            ? 'border-dashboard-text bg-dashboard-bg-muted'
                                            : 'border-transparent hover:bg-dashboard-bg-hover'
                                    )}
                                    title={opt}
                                >
                                    <Icon className="h-5 w-5" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
