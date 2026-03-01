/**
 * Field block configuration — block component + schema mapping for detail views
 *
 * The existing FIELD_CONFIG in entryFieldConfig.ts is unchanged (still referenced for triggersPreview)
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
        label: 'Date',
        schema: eventFieldSchemas.date,
        component: DateBlock,
    },
    {
        key: 'venue',
        label: 'Venue',
        schema: eventFieldSchemas.venue,
        component: VenueBlock,
    },
    {
        key: 'lineup',
        label: 'Lineup',
        schema: eventFieldSchemas.lineup,
        component: LineupBlock,
    },
    {
        key: 'description',
        label: 'Description',
        schema: eventFieldSchemas.description,
        component: DescriptionBlock,
    },
    {
        key: 'links',
        label: 'Links',
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
        label: 'Description',
        schema: mixsetFieldSchemas.description,
        component: DescriptionBlock,
    },
    {
        key: 'tracklist',
        label: 'Tracklist',
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
        label: 'Description',
        schema: linkFieldSchemas.description,
        component: DescriptionBlock,
    },
];
