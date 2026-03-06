# Custom Block Inline Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Section 래퍼를 제거하고 CustomEntryEditor에서 BlockWrapper + SyncedField + shared-field를 직접 조합한다.

**Architecture:** `BLOCK_RENDERERS` 레지스트리에 블록 타입별 렌더 함수를 선언. SortableBlock이 BlockWrapper로 감싸고 renderer를 호출. Section 파일 5개 삭제.

**Tech Stack:** React, SyncedField, shared-fields, dnd-kit

---

### Task 1: KEYVALUE_FIELD_CONFIG 추가

**Files:**

- Modify: `src/app/dashboard/config/fieldConfigs.ts`
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/index.ts`

**Step 1: fieldConfigs.ts에 config 추가**

```ts
export const KEYVALUE_FIELD_CONFIG: FieldSyncConfig<{ key: string; value: string }[]> = {
    debounceMs: 800,
};
```

**Step 2: shared-fields/index.ts에서 re-export**

`KEYVALUE_FIELD_CONFIG`를 export 목록에 추가.

**Step 3: tsc 확인**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```
feat(fields): add KEYVALUE_FIELD_CONFIG for block keyvalue fields
```

---

### Task 2: BLOCK_RENDERERS 작성 + Section 파일 삭제

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/HeaderSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/RichTextSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/ImageSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/EmbedSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/KeyValueSection.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/custom-blocks/index.ts`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/types.ts`

**Step 1: CustomEntryEditor에 BLOCK_RENDERERS 정의**

Section 컴포넌트 import를 제거하고, shared-field + SyncedField import로 교체.

```tsx
import {
    EmbedField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    KEYVALUE_FIELD_CONFIG,
    KeyValueField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    URL_FIELD_CONFIG,
} from './shared-fields';
import type { ImageItem } from './shared-fields/types';

interface BlockRenderProps {
    data: SectionBlockDataMap[SectionBlockType];
    onChange: (data: SectionBlockDataMap[SectionBlockType]) => void;
    disabled?: boolean;
}

// url string → ImageItem[] 변환 헬퍼
const toImageItems = (url: string): ImageItem[] => (url ? [{ id: 'block-img', url }] : []);

const KV_COLUMNS = [
    {
        key: 'key',
        placeholder: 'Label',
        width: 'w-28 shrink-0',
        className: 'font-medium text-dashboard-text-secondary',
    },
    { key: 'value', placeholder: 'Value', width: 'flex-1' },
];
const EMPTY_KV = { key: '', value: '' };

const BLOCK_RENDERERS: Record<SectionBlockType, (props: BlockRenderProps) => ReactNode> = {
    header: ({ data, onChange, disabled }) => {
        const d = data as SectionBlockDataMap['header'];
        return (
            <div className="space-y-1">
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={d.title}
                    onSave={(v) => onChange({ ...d, title: v })}
                >
                    <TextField
                        disabled={disabled}
                        placeholder="Heading"
                        className="text-lg font-bold text-dashboard-text"
                    />
                </SyncedField>
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={d.subtitle || ''}
                    onSave={(v) => onChange({ ...d, subtitle: v || undefined })}
                >
                    <TextField
                        disabled={disabled}
                        placeholder="Subtitle (optional)"
                        className="text-sm text-dashboard-text-secondary"
                    />
                </SyncedField>
            </div>
        );
    },
    richtext: ({ data, onChange, disabled }) => {
        const d = data as SectionBlockDataMap['richtext'];
        return (
            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={d.content}
                onSave={(v) => onChange({ ...d, content: v })}
            >
                <TextField
                    disabled={disabled}
                    variant="textarea"
                    placeholder="Write something..."
                    rows={3}
                    className="min-h-[80px] text-sm text-dashboard-text"
                />
            </SyncedField>
        );
    },
    image: ({ data, onChange, disabled }) => {
        const d = data as SectionBlockDataMap['image'];
        return (
            <SyncedField
                config={IMAGE_FIELD_CONFIG}
                value={toImageItems(d.url)}
                onSave={(items) => onChange({ url: items[0]?.url || '' })}
            >
                <ImageField disabled={disabled} maxCount={1} />
            </SyncedField>
        );
    },
    embed: ({ data, onChange, disabled }) => {
        const d = data as SectionBlockDataMap['embed'];
        return (
            <SyncedField
                config={URL_FIELD_CONFIG}
                value={d.url}
                onSave={(v) => onChange({ ...d, url: v })}
            >
                <EmbedField disabled={disabled} />
            </SyncedField>
        );
    },
    keyvalue: ({ data, onChange, disabled }) => {
        const d = data as SectionBlockDataMap['keyvalue'];
        return (
            <SyncedField
                config={KEYVALUE_FIELD_CONFIG}
                value={d.items}
                onSave={(v) => onChange({ ...d, items: v })}
                indicatorPosition="top-right"
            >
                <KeyValueField
                    disabled={disabled}
                    columns={[...KV_COLUMNS]}
                    emptyItem={EMPTY_KV}
                    addLabel="Add field"
                />
            </SyncedField>
        );
    },
};
```

**Step 2: SortableBlock에서 BLOCK_RENDERERS 사용**

```tsx
function SortableBlock({ block, onUpdate, onRemove, disabled }: SortableBlockProps) {
    // ... useSortable ...
    const config = SECTION_BLOCK_CONFIG[block.type];
    const render = BLOCK_RENDERERS[block.type];
    if (!config || !render) return null;

    return (
        <div ref={setNodeRef} style={style}>
            <BlockWrapper
                label={config.label}
                icon={config.icon}
                onDelete={() => onRemove(block.id)}
                dragHandleProps={{ attributes, listeners }}
                isDragging={isDragging}
                disabled={disabled}
            >
                {render({ data: block.data, onChange: (d) => onUpdate(block.id, d), disabled })}
            </BlockWrapper>
        </div>
    );
}
```

**Step 3: Section 파일 5개 + types.ts 삭제**

**Step 4: custom-blocks/index.ts 정리**

```ts
export { default as BlockWrapper } from './BlockWrapper';
```

**Step 5: tsc 확인**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```
refactor(CustomEntryEditor): inline shared-fields via BLOCK_RENDERERS, remove Section wrappers
```
