/**
 * 필드 블록 설정 — 상세보기에서 사용할 블록 컴포넌트 + 스키마 매핑
 *
 * 기존 entryFieldConfig.ts의 FIELD_CONFIG는 변경하지 않음 (triggersPreview 참조 중)
 */

import {
    eventFieldSchemas,
    linkFieldSchemas,
    mixsetFieldSchemas,
    urlFieldSchema,
} from '@/lib/validations/entry.schemas';
import DateBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DateBlock';
import DescriptionBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DescriptionBlock';
import LineupBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/LineupBlock';
import LinksBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/LinksBlock';
import TracklistBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/TracklistBlock';
import UrlBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/UrlBlock';
import VenueBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/VenueBlock';
import type { FieldBlockConfig } from '@/app/dashboard/components/ContentPanel/detail-views/types';

export const EVENT_FIELD_BLOCKS: FieldBlockConfig[] = [
    {
        key: 'date',
        label: '날짜',
        schema: eventFieldSchemas.date,
        component: DateBlock,
    },
    {
        key: 'venue',
        label: '장소',
        schema: eventFieldSchemas.venue,
        component: VenueBlock,
    },
    {
        key: 'lineup',
        label: '라인업',
        schema: eventFieldSchemas.lineup,
        component: LineupBlock,
    },
    {
        key: 'description',
        label: '설명',
        schema: eventFieldSchemas.description,
        component: DescriptionBlock,
    },
    {
        key: 'links',
        label: '링크',
        schema: eventFieldSchemas.links,
        component: LinksBlock,
    },
];

export const MIXSET_FIELD_BLOCKS: FieldBlockConfig[] = [
    {
        key: 'url',
        label: 'URL',
        schema: urlFieldSchema,
        component: UrlBlock,
    },
    {
        key: 'description',
        label: '설명',
        schema: mixsetFieldSchemas.description,
        component: DescriptionBlock,
    },
    {
        key: 'tracklist',
        label: '트랙리스트',
        schema: mixsetFieldSchemas.tracklist,
        component: TracklistBlock,
    },
];

export const LINK_FIELD_BLOCKS: FieldBlockConfig[] = [
    {
        key: 'url',
        label: 'URL',
        schema: urlFieldSchema,
        component: UrlBlock,
    },
    {
        key: 'description',
        label: '설명',
        schema: linkFieldSchemas.description,
        component: DescriptionBlock,
    },
];
