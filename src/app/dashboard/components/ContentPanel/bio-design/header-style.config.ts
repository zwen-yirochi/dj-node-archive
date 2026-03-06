import type { HeaderStyle } from '@/types/domain';

export interface HeaderStyleDef {
    key: HeaderStyle;
    label: string;
    description: string;
}

export const headerStyleConfig: Record<HeaderStyle, HeaderStyleDef> = {
    minimal: {
        key: 'minimal',
        label: 'Minimal',
        description: 'Clean header with avatar and bio',
    },
    banner: {
        key: 'banner',
        label: 'Banner',
        description: 'Wide banner image with overlay text',
    },
    portrait: {
        key: 'portrait',
        label: 'Portrait',
        description: 'Large centered portrait layout',
    },
    shapes: {
        key: 'shapes',
        label: 'Shapes',
        description: 'Geometric decorative header',
    },
};

export const headerStyles = Object.values(headerStyleConfig);
