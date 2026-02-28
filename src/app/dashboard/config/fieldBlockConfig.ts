/**
 * 필드 블록 설정 — Event 상세보기에서 사용할 블록 컴포넌트 + 스키마 매핑
 *
 * 기존 entryFieldConfig.ts의 FIELD_CONFIG는 변경하지 않음 (triggersPreview 참조 중)
 */

import DateBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DateBlock';
import DescriptionBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/DescriptionBlock';
import LineupBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/LineupBlock';
import LinksBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/LinksBlock';
import VenueBlock from '@/app/dashboard/components/ContentPanel/detail-views/blocks/VenueBlock';
import {
    dateBlockSchema,
    descriptionBlockSchema,
    lineupBlockSchema,
    linksBlockSchema,
    venueBlockSchema,
} from '@/app/dashboard/components/ContentPanel/detail-views/schemas';
import type { FieldBlockConfig } from '@/app/dashboard/components/ContentPanel/detail-views/types';

export const EVENT_FIELD_BLOCKS: FieldBlockConfig[] = [
    {
        key: 'date',
        label: '날짜',
        schema: dateBlockSchema,
        component: DateBlock,
    },
    {
        key: 'venue',
        label: '장소',
        schema: venueBlockSchema,
        component: VenueBlock,
    },
    {
        key: 'lineup',
        label: '라인업',
        schema: lineupBlockSchema,
        component: LineupBlock,
    },
    {
        key: 'description',
        label: '설명',
        schema: descriptionBlockSchema,
        component: DescriptionBlock,
    },
    {
        key: 'links',
        label: '링크',
        schema: linksBlockSchema,
        component: LinksBlock,
    },
];
