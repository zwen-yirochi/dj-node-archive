import type { ComponentType } from 'react';

import type { ContentEntry, User } from '@/types';
import type { HeaderStyle } from '@/types/domain';

import { BannerHeader } from './BannerHeader';
import { MinimalHeader } from './MinimalHeader';
import { PortraitHeader } from './PortraitHeader';
import { ShapesHeader } from './ShapesHeader';

export interface HeaderProps {
    user: User;
    entries: ContentEntry[];
}

export const headerRenderers: Record<HeaderStyle, ComponentType<HeaderProps>> = {
    minimal: MinimalHeader,
    banner: BannerHeader,
    portrait: PortraitHeader,
    shapes: ShapesHeader,
};
