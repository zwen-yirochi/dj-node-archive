import type { ComponentType } from 'react';

import { GalleryHorizontal, LayoutGrid, List, Sparkles } from 'lucide-react';

import type { ViewType } from '@/types/domain';

export interface ViewTypeOption {
    value: ViewType;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

export const VIEW_TYPE_OPTIONS: ViewTypeOption[] = [
    { value: 'carousel', label: 'Carousel', icon: GalleryHorizontal },
    { value: 'list', label: 'List', icon: List },
    { value: 'grid', label: 'Grid', icon: LayoutGrid },
    { value: 'feature', label: 'Feature', icon: Sparkles },
];
