# DetailView 리팩터링 + Save Indicator 설계

> 2026-03-06 | Issue #108

## 목표

1. UnifiedDetailView Slot 패턴 → 개별 DetailView 컴포넌트 전환
2. FieldSync render-props → SyncedField 래퍼 (save indicator 내장)
3. 이중 버퍼링 제거 (localEntry + useDebouncedSave → TQ 직결)

## 1. SyncedField 래퍼

### API

```tsx
<SyncedField config={DATE_FIELD_CONFIG} value={entry.date} onSave={(v) => onSave('date', v)}>
    <DateField disabled={disabled} />
</SyncedField>
```

### 동작

- `React.cloneElement`로 children에 `value`/`onChange` 자동 주입
- `config.immediate`: true → passthrough, false → `useFieldSync` debounce
- `config.schema`: Zod 검증, 실패 시 error 상태

### Save Indicator (SyncedField 내부 렌더링)

| SaveStatus | UI                                |
| ---------- | --------------------------------- |
| `idle`     | 없음                              |
| `saving`   | amber dot, pulse animation        |
| `saved`    | 체크 아이콘, 2초 후 fade out      |
| `error`    | 빨간 dot + validation 에러 메시지 |

레이아웃: 필드 우측 끝에 dot/아이콘 배치.

## 2. 헤더 Save Indicator

EntryDetailView 헤더의 텍스트 → 아이콘+애니메이션 교체.

| 상태               | UI                                    |
| ------------------ | ------------------------------------- |
| idle               | 없음                                  |
| pending (mutation) | Loader2 spin                          |
| success            | 체크 아이콘 fade in → 3초 후 fade out |
| error              | 빨간 경고 아이콘 + "Save failed"      |

위치: TypeBadge 오른쪽.

## 3. 개별 DetailView 전환

### 파일 구조

```
detail-views/
  EventDetailView.tsx    ← EventEntry
  MixsetDetailView.tsx   ← MixsetEntry
  LinkDetailView.tsx     ← LinkEntry
  types.ts               ← 타입별 props (FieldSaveFn 유지)
  utils.ts               ← urlToStableId 유지
```

### 삭제 대상

- `detail-views/UnifiedDetailView.tsx`
- `config/detailViewConfig.ts` (Slot 타입 + config)

### EntryDetailView 분기

```tsx
{
    entry.type === 'event' && <EventDetailView entry={entry} onSave={handleFieldSave} />;
}
{
    entry.type === 'mixset' && <MixsetDetailView entry={entry} onSave={handleFieldSave} />;
}
{
    entry.type === 'link' && <LinkDetailView entry={entry} onSave={handleFieldSave} />;
}
```

## 4. 이중 버퍼링 제거

### Before

```
Field → useFieldSync(debounce) → localEntry useState → useDebouncedSave(debounce) → mutation
```

### After

```
Field → SyncedField(debounce + indicator) → onSave → updateField mutation → TQ optimistic update
```

### 새 mutation: updateField

```tsx
const updateField = useMutation(
    m<{ entryId: string; fieldKey: string; value: unknown }>({
        mutationFn: ({ entryId, fieldKey, value }, entries) => {
            const current = entries?.find((e) => e.id === entryId);
            if (!current) throw new Error('Entry not found');
            return updateEntry({ id: entryId, entry: { ...current, [fieldKey]: value } });
        },
        optimisticUpdate: ({ entryId, fieldKey, value }, entries) =>
            entries.map((e) => (e.id === entryId ? { ...e, [fieldKey]: value } : e)),
        triggersPreview: ({ entryId, fieldKey }, snapshot) => {
            const entry = snapshot.find((e) => e.id === entryId);
            return entry ? hasPreviewField(entry.type, [fieldKey]) : false;
        },
        previewTarget: 'entry-detail',
    })
);
```

### EntryDetailView 삭제 대상

- `localEntry` / `localEntryRef` useState
- `useDebouncedSave` 함수
- `handleFieldSave`의 `options.immediate` 분기
- `getSaveStatus()` 텍스트 로직 (아이콘 indicator로 대체)

### EntryDetailView 간소화

```tsx
export default function EntryDetailView({ entryId, onBack }: Props) {
    const { data: entry } = useEntryDetail(entryId);
    const { updateField, remove } = useEntryMutations();

    const handleFieldSave = useCallback(
        (fieldKey: string, value: unknown) => {
            updateField.mutate({ entryId, fieldKey, value });
        },
        [entryId, updateField]
    );

    // entry는 TQ 캐시에서 직접 — optimistic update로 즉시 반영
    return (
        <div className="flex h-full flex-col">
            <Header entry={entry} mutationStatus={updateField.status} />
            <div className="flex-1 overflow-y-auto p-6">
                {entry.type === 'event' && (
                    <EventDetailView entry={entry} onSave={handleFieldSave} />
                )}
                {entry.type === 'mixset' && (
                    <MixsetDetailView entry={entry} onSave={handleFieldSave} />
                )}
                {entry.type === 'link' && <LinkDetailView entry={entry} onSave={handleFieldSave} />}
            </div>
        </div>
    );
}
```

## 영향 범위

| 파일                                 | 변경                                          |
| ------------------------------------ | --------------------------------------------- |
| `shared-fields/FieldSync.tsx`        | → `SyncedField.tsx`로 리네임 + indicator 추가 |
| `shared-fields/index.ts`             | export 업데이트                               |
| `detail-views/UnifiedDetailView.tsx` | 삭제                                          |
| `config/detailViewConfig.ts`         | 삭제                                          |
| `detail-views/EventDetailView.tsx`   | 신규                                          |
| `detail-views/MixsetDetailView.tsx`  | 신규                                          |
| `detail-views/LinkDetailView.tsx`    | 신규                                          |
| `detail-views/types.ts`              | 타입별 props 추가                             |
| `EntryDetailView.tsx`                | localEntry 제거, 분기 변경, 헤더 indicator    |
| `hooks/use-mutations.ts`             | updateField mutation 추가                     |
| `custom-blocks/ImageSection.tsx`     | FieldSync → SyncedField 전환                  |
