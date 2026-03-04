import type { ProfileLink, ProfileLinkType } from '@/types';

import { PLATFORM_PRESETS } from '../../../config/profileLinksConfig';

/** Internal representation — presets always exist, toggled on/off */
export interface LinkItem {
    id: string;
    type: ProfileLinkType;
    url: string;
    label?: string;
    isPreset: boolean;
    enabled: boolean;
}

/** Preset types (always visible, cannot be deleted) */
export const PRESET_TYPES = PLATFORM_PRESETS.filter((p) => p.type !== 'custom').map((p) => p.type);

/** Convert server ProfileLink[] → internal LinkItem[] (presets always present) */
export function buildLinkItems(links: ProfileLink[]): LinkItem[] {
    const items: LinkItem[] = [];
    let customIndex = 0;

    for (const link of links) {
        const isPreset = PRESET_TYPES.includes(link.type);
        items.push({
            id: isPreset ? `preset-${link.type}` : `custom-${customIndex++}`,
            type: link.type,
            url: link.url,
            label: link.label,
            isPreset,
            enabled: link.enabled !== false,
        });
    }

    for (const presetType of PRESET_TYPES) {
        if (!links.some((l) => l.type === presetType)) {
            items.push({
                id: `preset-${presetType}`,
                type: presetType,
                url: '',
                isPreset: true,
                enabled: false,
            });
        }
    }

    return items;
}

/** Convert internal LinkItem[] → server ProfileLink[] (includes disabled items with data) */
export function toProfileLinks(items: LinkItem[]): ProfileLink[] {
    return items
        .filter((item) => item.url.trim() !== '' || item.isPreset)
        .map((item) => ({
            type: item.type,
            url: item.url,
            ...(item.type === 'custom' && item.label ? { label: item.label } : {}),
            ...(item.enabled ? {} : { enabled: false }),
        }));
}
