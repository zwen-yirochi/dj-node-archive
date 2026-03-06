/**
 * Field block configuration — block component + schema mapping for detail views
 *
 * key/label은 FIELD_CONFIG(entryFieldConfig)에서 가져온다 (단일 소스).
 * 이 파일은 schema + component만 선언한다.
 */

import type { ComponentType } from 'react';

import type { ZodSchema } from 'zod';

import {
    eventFieldSchemas,
    linkFieldSchemas,
    mixsetFieldSchemas,
    urlFieldSchema,
} from '@/lib/validations/entry.schemas';
import DateBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DateBlock';
import DescriptionBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DescriptionBlock';
import LineupBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/LineupBlock';
import TracklistBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/TracklistBlock';
import UrlBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/UrlBlock';
import VenueBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/VenueBlock';
import type {
    FieldBlockConfig,
    FieldBlockProps,
} from '@/app/dashboard/components/ContentPanel/detail-views/types';

import type { EntryType } from './entryConfig';
import { FIELD_CONFIG } from './entryFieldConfig';

// ============================================
// 헬퍼: FIELD_CONFIG에서 key/label을 가져와 FieldBlockConfig 생성
// ============================================

function fieldBlock(
    type: EntryType,
    key: string,
    extra: { schema: ZodSchema; component: ComponentType<FieldBlockProps> }
): FieldBlockConfig {
    const field = FIELD_CONFIG[type].find((f) => f.key === key);
    if (!field) {
        throw new Error(`FIELD_CONFIG['${type}']에 '${key}' 없음`);
    }
    return { key: field.key, label: field.label, ...extra };
}

// ============================================
// Per-type field blocks
// ============================================

export const EVENT_FIELD_BLOCKS: FieldBlockConfig[] = [
    fieldBlock('event', 'date', { schema: eventFieldSchemas.date, component: DateBlock }),
    fieldBlock('event', 'venue', { schema: eventFieldSchemas.venue, component: VenueBlock }),
    fieldBlock('event', 'lineup', { schema: eventFieldSchemas.lineup, component: LineupBlock }),
    fieldBlock('event', 'description', {
        schema: eventFieldSchemas.description,
        component: DescriptionBlock,
    }),
];

export const MIXSET_FIELD_BLOCKS: FieldBlockConfig[] = [
    fieldBlock('mixset', 'url', { schema: urlFieldSchema, component: UrlBlock }),
    fieldBlock('mixset', 'description', {
        schema: mixsetFieldSchemas.description,
        component: DescriptionBlock,
    }),
    fieldBlock('mixset', 'tracklist', {
        schema: mixsetFieldSchemas.tracklist,
        component: TracklistBlock,
    }),
];

export const LINK_FIELD_BLOCKS: FieldBlockConfig[] = [
    fieldBlock('link', 'url', { schema: urlFieldSchema, component: UrlBlock }),
    fieldBlock('link', 'description', {
        schema: linkFieldSchemas.description,
        component: DescriptionBlock,
    }),
];

/** Record 기반 — 새 EntryType 추가 시 누락하면 컴파일 에러 */
export const FIELD_BLOCKS: Record<EntryType, FieldBlockConfig[]> = {
    event: EVENT_FIELD_BLOCKS,
    mixset: MIXSET_FIELD_BLOCKS,
    link: LINK_FIELD_BLOCKS,
    custom: [], // custom uses SECTION_BLOCK_CONFIG
};
