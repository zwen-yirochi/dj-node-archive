'use client';

import { useEffect, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

import type { ProfileLink, ProfileLinkType } from '@/types';
import {
    profileLinkSchema,
    type ProfileLinkFormData,
} from '@/lib/validations/profile-link.schemas';
import { useDebounce } from '@/hooks/useDebounce';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
    getPlatformLabel,
    getPlatformPlaceholder,
    PLATFORM_PRESETS,
} from '../../config/profileLinksConfig';

// ============================================
// Props
// ============================================

interface LinksSectionProps {
    links: ProfileLink[];
    onSave: (links: ProfileLink[]) => void;
}

// ============================================
// LinkRow — single link with RHF validation
// ============================================

interface LinkRowProps {
    link: ProfileLink;
    index: number;
    onChange: (index: number, updated: ProfileLink) => void;
    onDelete: (index: number) => void;
    autoFocusUrl?: boolean;
}

function LinkRow({ link, index, onChange, onDelete, autoFocusUrl }: LinkRowProps) {
    const urlRef = useRef<HTMLInputElement | null>(null);

    const {
        register,
        watch,
        formState: { errors },
    } = useForm<ProfileLinkFormData>({
        resolver: zodResolver(profileLinkSchema),
        defaultValues: {
            type: link.type,
            url: link.url,
            label: link.label ?? '',
        },
        mode: 'onChange',
    });

    // Auto-focus URL input when newly added
    useEffect(() => {
        if (autoFocusUrl && urlRef.current) {
            urlRef.current.focus();
        }
    }, [autoFocusUrl]);

    // Watch fields and propagate validated changes upward
    const url = watch('url');
    const label = watch('label');

    useEffect(() => {
        // Only propagate if value actually changed
        if (url !== link.url || label !== (link.label ?? '')) {
            const updated: ProfileLink = {
                type: link.type,
                url,
                ...(link.type === 'custom' && label ? { label } : {}),
            };
            onChange(index, updated);
        }
    }, [url, label]); // Only re-run when watched values change

    const { ref: urlRegRef, ...urlRegRest } = register('url');

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {/* Platform label */}
                <span className="w-20 shrink-0 text-xs font-medium text-dashboard-text-muted">
                    {getPlatformLabel(link.type)}
                </span>

                {/* URL input */}
                <Input
                    {...urlRegRest}
                    ref={(el) => {
                        urlRegRef(el);
                        urlRef.current = el;
                    }}
                    placeholder={getPlatformPlaceholder(link.type)}
                    className="flex-1 border-dashboard-border bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder"
                />

                {/* Delete button */}
                <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className="shrink-0 rounded p-1 text-dashboard-text-muted hover:text-dashboard-text"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Custom label input */}
            {link.type === 'custom' && (
                <div className="ml-[88px] mr-8">
                    <Input
                        {...register('label')}
                        placeholder="Label"
                        className="h-7 border-dashboard-border bg-transparent text-xs text-dashboard-text placeholder:text-dashboard-text-placeholder"
                    />
                    {errors.label && (
                        <p className="mt-0.5 text-xs text-red-500">{errors.label.message}</p>
                    )}
                </div>
            )}

            {/* URL validation error */}
            {errors.url && <p className="ml-[88px] text-xs text-red-500">{errors.url.message}</p>}
        </div>
    );
}

// ============================================
// LinksSection — collapsible section
// ============================================

export default function LinksSection({ links, onSave }: LinksSectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [localLinks, setLocalLinks] = useState<ProfileLink[]>(links);
    const [focusIndex, setFocusIndex] = useState<number | null>(null);

    // Sync from parent when links prop changes (e.g. server reconciliation)
    useEffect(() => {
        setLocalLinks(links);
    }, [links]);

    // Debounced save to server
    const debouncedSave = useDebounce((updatedLinks: ProfileLink[]) => {
        onSave(updatedLinks);
    }, 500);

    // ---- Handlers ----

    const handleAddLink = (type: ProfileLinkType) => {
        const newLink: ProfileLink = {
            type,
            url: '',
            ...(type === 'custom' ? { label: '' } : {}),
        };
        const updated = [...localLinks, newLink];
        setLocalLinks(updated);
        setFocusIndex(updated.length - 1);
    };

    const handleChange = (index: number, updated: ProfileLink) => {
        const next = localLinks.map((l, i) => (i === index ? updated : l));
        setLocalLinks(next);
        debouncedSave(next);
    };

    const handleDelete = (index: number) => {
        const next = localLinks.filter((_, i) => i !== index);
        setLocalLinks(next);
        onSave(next); // Immediate save on delete
    };

    // Filter out already-added preset platforms (custom is always available)
    const availablePlatforms = PLATFORM_PRESETS.filter(
        (preset) =>
            preset.type === 'custom' || !localLinks.some((link) => link.type === preset.type)
    );

    return (
        <section>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-2 text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    Links
                </h3>
            </button>

            {isOpen && (
                <div className="mt-4 space-y-3">
                    {/* Existing links */}
                    {localLinks.map((link, i) => (
                        <LinkRow
                            key={`${link.type}-${i}`}
                            link={link}
                            index={i}
                            onChange={handleChange}
                            onDelete={handleDelete}
                            autoFocusUrl={i === focusIndex}
                        />
                    ))}

                    {/* Add link button with dropdown */}
                    {availablePlatforms.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-dashboard-text"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>링크 추가</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {availablePlatforms.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.type}
                                        onSelect={() => handleAddLink(preset.type)}
                                    >
                                        {preset.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}
        </section>
    );
}
