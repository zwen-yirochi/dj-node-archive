/**
 * Config 정합성 검증 테스트
 *
 * ENTRY_TYPE_CONFIG를 single source of truth로 삼고,
 * 나머지 config들이 모든 EntryType을 빠짐없이 커버하는지 검증한다.
 */
import type { Entry } from '@/types/database';
import type { ContentEntry, CustomEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types/domain';
import { createEmptyEntry, mapEntryToDatabase, mapEntryToDomain } from '@/lib/mappers';
import {
    draftCustomSchema,
    draftEventSchema,
    draftLinkSchema,
    draftMixsetSchema,
} from '@/lib/validations/entry.schemas';

import { ENTRY_TYPE_CONFIG, type EntryType } from '../entryConfig';
import { ENTRY_SCHEMAS, FIELD_CONFIG } from '../entryFieldConfig';
import { EDITOR_MENU_CONFIG } from '../menuConfig';
import { COMPONENT_GROUPS } from '../sidebarConfig';

// EntryType 전체 목록 — entryConfig에서 파생
const ALL_TYPES = Object.keys(ENTRY_TYPE_CONFIG) as EntryType[];

describe('Config 완결성: 모든 EntryType이 각 config에 정의됨', () => {
    it('FIELD_CONFIG에 모든 타입 존재', () => {
        for (const type of ALL_TYPES) {
            expect(FIELD_CONFIG[type], `FIELD_CONFIG['${type}'] 누락`).toBeDefined();
        }
    });

    it('ENTRY_SCHEMAS에 모든 타입 존재 (create + view)', () => {
        for (const type of ALL_TYPES) {
            expect(ENTRY_SCHEMAS[type], `ENTRY_SCHEMAS['${type}'] 누락`).toBeDefined();
            expect(
                ENTRY_SCHEMAS[type].create,
                `ENTRY_SCHEMAS['${type}'].create 누락`
            ).toBeDefined();
            expect(ENTRY_SCHEMAS[type].view, `ENTRY_SCHEMAS['${type}'].view 누락`).toBeDefined();
        }
    });

    it('EDITOR_MENU_CONFIG에 모든 타입 존재', () => {
        for (const type of ALL_TYPES) {
            expect(EDITOR_MENU_CONFIG[type], `EDITOR_MENU_CONFIG['${type}'] 누락`).toBeDefined();
        }
    });

    it('COMPONENT_GROUPS가 모든 타입을 커버', () => {
        const coveredTypes = COMPONENT_GROUPS.map((g) => g.entryType);
        for (const type of ALL_TYPES) {
            expect(coveredTypes, `COMPONENT_GROUPS에 '${type}' 누락`).toContain(type);
        }
    });
});

// EntryBase 공통 필드 — config에서 관리하지 않는 인프라 필드
const BASE_FIELDS = new Set([
    'id',
    'type',
    'position',
    'displayOrder',
    'isVisible',
    'createdAt',
    'updatedAt',
]);

describe('FIELD_CONFIG 키 ↔ 도메인 타입 필드 매핑', () => {
    for (const type of ALL_TYPES) {
        it(`${type}: FIELD_CONFIG 키가 실제 도메인 필드에 존재`, () => {
            const entry = createEmptyEntry(type);
            const entryKeys = Object.keys(entry).filter((k) => !BASE_FIELDS.has(k));
            const configKeys = FIELD_CONFIG[type].map((f) => f.key);

            // config의 모든 키가 실제 엔트리에 존재해야 함
            for (const key of configKeys) {
                expect(
                    entryKeys,
                    `FIELD_CONFIG['${type}']의 '${key}'가 도메인 타입에 없음`
                ).toContain(key);
            }
        });
    }
});

// ============================================
// 라운드트립 헬퍼
// ============================================

/** DB Entry stub — mapEntryToDomain이 요구하는 최소 필드 */
function toDbEntry(entry: ContentEntry): Entry {
    const dbFields = mapEntryToDatabase(entry, entry.position);
    return {
        id: entry.id,
        page_id: 'test-page',
        reference_id: null,
        created_at: entry.createdAt || new Date().toISOString(),
        updated_at: entry.updatedAt || new Date().toISOString(),
        ...dbFields,
    } as Entry;
}

// ============================================
// 라운드트립 테스트: domain → DB → domain 데이터 보존
// ============================================

describe('mapEntryToDatabase ↔ mapEntryToDomain 라운드트립', () => {
    it('event: 자체형 이벤트 필드 보존', () => {
        const original: EventEntry = {
            ...(createEmptyEntry('event') as EventEntry),
            title: 'Test Event',
            date: '2026-03-05',
            venue: { name: 'Club' },
            lineup: [{ name: 'DJ A' }],
            posterUrl: 'https://example.com/poster.jpg',
            description: 'A great event',
            links: [{ title: 'Tickets', url: 'https://tickets.com' }],
        };

        const restored = mapEntryToDomain(toDbEntry(original));

        expect(restored.type).toBe('event');
        const r = restored as EventEntry;
        expect(r.title).toBe(original.title);
        expect(r.date).toBe(original.date);
        expect(r.venue.name).toBe(original.venue.name);
        expect(r.lineup).toHaveLength(1);
        expect(r.posterUrl).toBe(original.posterUrl);
        expect(r.description).toBe(original.description);
        expect(r.links).toHaveLength(1);
    });

    it('mixset: 자체형 믹스셋 필드 보존', () => {
        const original: MixsetEntry = {
            ...(createEmptyEntry('mixset') as MixsetEntry),
            title: 'Test Mix',
            coverUrl: 'https://example.com/cover.jpg',
            url: 'https://soundcloud.com/mix',
            tracklist: [{ track: 'Track 1', artist: 'Artist', time: '0:00' }],
            description: 'A great mix',
        };

        const restored = mapEntryToDomain(toDbEntry(original));

        expect(restored.type).toBe('mixset');
        const r = restored as MixsetEntry;
        expect(r.title).toBe(original.title);
        expect(r.coverUrl).toBe(original.coverUrl);
        expect(r.url).toBe(original.url);
        expect(r.tracklist).toHaveLength(1);
        expect(r.description).toBe(original.description);
    });

    it('link: 모든 필드 보존 (description 포함)', () => {
        const original: LinkEntry = {
            ...(createEmptyEntry('link') as LinkEntry),
            title: 'My Link',
            url: 'https://example.com',
            icon: 'globe',
            description: 'A useful link',
        };

        const restored = mapEntryToDomain(toDbEntry(original));

        expect(restored.type).toBe('link');
        const r = restored as LinkEntry;
        expect(r.title).toBe(original.title);
        expect(r.url).toBe(original.url);
        expect(r.icon).toBe(original.icon);
        // C1-1 수정 검증: 이전에는 description이 유실되었음
        expect(r.description).toBe(original.description);
    });

    it('custom: title + blocks 보존', () => {
        const original: CustomEntry = {
            ...(createEmptyEntry('custom') as CustomEntry),
            title: 'Custom Section',
            blocks: [
                { id: 'block-1', type: 'header', data: { title: 'Hello', subtitle: undefined } },
                { id: 'block-2', type: 'richtext', data: { content: 'Some text' } },
            ],
        };

        const restored = mapEntryToDomain(toDbEntry(original));

        expect(restored.type).toBe('custom');
        const r = restored as CustomEntry;
        expect(r.title).toBe(original.title);
        expect(r.blocks).toHaveLength(2);
        expect(r.blocks[0].type).toBe('header');
        expect(r.blocks[1].data).toEqual({ content: 'Some text' });
    });
});

// ============================================
// Schema 기본값 ↔ Factory 기본값 일치
// ============================================

describe('draftSchema 기본값 ↔ createEmptyEntry 기본값 일치', () => {
    /**
     * safeParse로 default를 추출하는 헬퍼.
     *
     * Zod의 .default()는 해당 필드가 undefined일 때만 적용된다.
     * 빈 객체를 넘기면 필수 필드는 실패하지만, optional + default 필드는 채워진다.
     * safeParse를 쓰면 에러가 나도 data를 참조할 수 없으므로,
     * 필수 필드에 유효한 더미값을 넣어서 parse를 통과시킨다.
     */

    it('event: optional 필드 기본값 일치', () => {
        // 필수 필드(title, posterUrl)에 유효한 더미값 → 나머지 default 추출
        const schemaDefaults = draftEventSchema.parse({
            title: 'xx', // min 2
            posterUrl: 'x', // min 1
        });
        const factory = createEmptyEntry('event') as EventEntry;

        expect(factory.date).toBe(schemaDefaults.date); // '' === ''
        expect(factory.venue).toEqual(schemaDefaults.venue); // {name:''} === {name:''}
        expect(factory.lineup).toEqual(schemaDefaults.lineup); // [] === []
        expect(factory.description).toBe(schemaDefaults.description); // '' === ''
    });

    it('mixset: optional 필드 기본값 일치', () => {
        const schemaDefaults = draftMixsetSchema.parse({
            title: 'x', // min 1
            url: 'https://example.com', // valid URL
        });
        const factory = createEmptyEntry('mixset') as MixsetEntry;

        expect(factory.coverUrl).toBe(schemaDefaults.coverUrl); // '' === ''
    });

    it('custom: optional 필드 기본값 일치', () => {
        const schemaDefaults = draftCustomSchema.parse({
            title: 'x', // min 1
        });
        const factory = createEmptyEntry('custom') as CustomEntry;

        expect(factory.blocks).toEqual(schemaDefaults.blocks); // [] === []
    });
});
