'use client';

import { LINK_ICON_COMPONENTS } from '@/constants/entries/entryConfig';
import { ICON_OPTIONS, type LinkComponent } from '@/types';
import { Globe } from 'lucide-react';

interface LinkEditorProps {
    component: LinkComponent;
    onUpdate: (updates: Partial<LinkComponent>) => void;
}

export default function LinkEditor({ component, onUpdate }: LinkEditorProps) {
    return (
        <div className="space-y-6">
            {/* Icon Selector */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    아이콘
                </label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {ICON_OPTIONS.map((icon) => {
                        const IconComponent = LINK_ICON_COMPONENTS[icon] || Globe;
                        return (
                            <button
                                key={icon}
                                onClick={() => onUpdate({ icon })}
                                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors ${
                                    component.icon === icon
                                        ? 'border-dashboard-text bg-dashboard-bg-muted'
                                        : 'border-dashboard-border hover:border-dashboard-border-hover'
                                }`}
                                title={icon}
                            >
                                <IconComponent className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    제목 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={component.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="SoundCloud, Instagram, etc."
                />
            </div>

            {/* URL */}
            <div>
                <label className="mb-2 block text-sm font-medium text-dashboard-text-secondary">
                    URL <span className="text-red-500">*</span>
                </label>
                <input
                    type="url"
                    value={component.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    className="w-full rounded-lg border border-dashboard-border-hover bg-dashboard-bg-card px-4 py-3 focus:border-dashboard-text focus:outline-none focus:ring-1 focus:ring-dashboard-text-muted"
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}
