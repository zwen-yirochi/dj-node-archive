# VenueField 리팩토링 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** VenueField에서 로직을 3개 훅으로 분리하여 UI 전용 컴포넌트로 만들고, Storybook 테스트 작성

**Architecture:** 범용 훅 2개(`useClickOutside`, `useScrollIntoView`)는 `src/hooks/ui/`에, 도메인 훅 1개(`useVenueSearch`)는 `shared-fields/hooks/`에 배치. VenueField는 훅을 조합하여 UI만 렌더링.

**Tech Stack:** React 19, TypeScript, Storybook 10 (@storybook/nextjs-vite)

---

### Task 1: useClickOutside 범용 훅

**Files:**

- Create: `src/hooks/ui/useClickOutside.ts`

**Step 1: 구현**

```ts
'use client';

import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
    onClickOutside: () => void
): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        function handleMouseDown(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        }
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [onClickOutside]);

    return ref;
}
```

**Step 2: Commit**

```
feat(hooks): add useClickOutside generic hook
```

---

### Task 2: useScrollIntoView 범용 훅

**Files:**

- Create: `src/hooks/ui/useScrollIntoView.ts`

**Step 1: 구현**

```ts
'use client';

import { useEffect, useRef } from 'react';

export function useScrollIntoView<T extends HTMLElement>(
    activeIndex: number
): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (activeIndex >= 0 && ref.current) {
            const item = ref.current.children[activeIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    return ref;
}
```

**Step 2: Commit**

```
feat(hooks): add useScrollIntoView generic hook
```

---

### Task 3: useVenueSearch 도메인 훅

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/shared-fields/hooks/useVenueSearch.ts`
- Reference: `src/app/dashboard/services/search.ts` — `searchVenues` 함수

**Step 1: 구현**

AbortController로 race condition 방지, retryCount로 재시도 지원.

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { searchVenues } from '@/app/dashboard/services/search';

export type SearchResult = { id: string; name: string; subtitle?: string };

interface UseVenueSearchOptions {
    debounceMs?: number;
}

interface UseVenueSearchReturn {
    query: string;
    setQuery: (q: string) => void;
    results: SearchResult[];
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    highlightedIndex: number;
    setHighlightedIndex: (index: number) => void;
    retry: () => void;
}

function toSearchResults(
    options: { id?: string; name: string; subtitle?: string }[]
): SearchResult[] {
    return options.filter((o): o is SearchResult => !!o.id);
}

export function useVenueSearch({
    debounceMs = 300,
}: UseVenueSearchOptions = {}): UseVenueSearchReturn {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [retryCount, setRetryCount] = useState(0);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoading(true);
            try {
                const data = await searchVenues(query);
                if (!controller.signal.aborted) {
                    setResults(toSearchResults(data));
                    setIsOpen(true);
                    setHighlightedIndex(-1);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, debounceMs);

        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [query, debounceMs, retryCount]);

    const retry = useCallback(() => {
        setRetryCount((c) => c + 1);
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
        retry,
    };
}
```

**Step 2: Commit**

```
feat(shared-fields): add useVenueSearch hook with AbortController
```

---

### Task 4: VenueField 리팩토링

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/VenueField.tsx`

**Step 1: 3개 훅을 조합하여 UI 전용으로 리팩토링**

VenueField에서 useRef 3개, useEffect 3개, useState 5개가 제거되고 훅 호출 3개로 대체.

```tsx
'use client';

import { useCallback } from 'react';

import { Loader2, MapPin, X } from 'lucide-react';

import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { useScrollIntoView } from '@/hooks/ui/useScrollIntoView';

import { useVenueSearch, type SearchResult } from './hooks/useVenueSearch';
import type { FieldComponentProps } from './types';

type VenueValue = { id?: string; name: string };

interface VenueFieldProps extends FieldComponentProps<VenueValue> {
    placeholder?: string;
    className?: string;
}

export default function VenueField({
    value = { name: '' },
    onChange,
    disabled,
    placeholder = 'Search venue...',
    className,
}: VenueFieldProps) {
    const {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
    } = useVenueSearch();

    const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
    const listRef = useScrollIntoView<HTMLUListElement>(highlightedIndex);

    const handleSelect = useCallback(
        (result: SearchResult) => {
            onChange?.({ id: result.id, name: result.name });
            setQuery('');
            setIsOpen(false);
            setHighlightedIndex(-1);
        },
        [onChange, setQuery, setIsOpen, setHighlightedIndex]
    );

    const handleClear = useCallback(() => {
        onChange?.({ name: '' });
        setQuery('');
    }, [onChange, setQuery]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen || results.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(
                        highlightedIndex < results.length - 1 ? highlightedIndex + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(
                        highlightedIndex > 0 ? highlightedIndex - 1 : results.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                        handleSelect(results[highlightedIndex]);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    break;
            }
        },
        [isOpen, results, highlightedIndex, handleSelect, setIsOpen, setHighlightedIndex]
    );

    if (value.id && value.name) {
        return (
            <div className={className}>
                <div className="flex items-center gap-2 rounded-md border border-dashboard-border bg-dashboard-bg-muted px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                    <span className="flex-1 text-sm text-dashboard-text">{value.name}</span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-dashboard-text-placeholder transition-colors hover:text-dashboard-text"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <input
                type="text"
                value={query || value.name}
                onChange={(e) => {
                    const v = e.target.value;
                    setQuery(v);
                    onChange?.({ name: v });
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 1 && results.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-transparent text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
            />

            {isLoading && (
                <Loader2 className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-dashboard-text-placeholder" />
            )}

            {isOpen && results.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-dashboard-border bg-dashboard-bg-card p-1 shadow-lg"
                    role="listbox"
                >
                    {results.map((result, index) => (
                        <li
                            key={result.id}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                                highlightedIndex === index
                                    ? 'bg-dashboard-bg-hover text-dashboard-text'
                                    : 'text-dashboard-text-secondary hover:bg-dashboard-bg-hover'
                            }`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-dashboard-text-placeholder" />
                            <div className="flex-1">
                                <span>{result.name}</span>
                                {result.subtitle && (
                                    <span className="ml-1 text-xs text-dashboard-text-placeholder">
                                        · {result.subtitle}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

**Step 2: Commit**

```
refactor(VenueField): extract hooks, UI rendering only
```

---

### Task 5: VenueField Storybook

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/shared-fields/VenueField.stories.tsx`

**Step 1: 스토리 작성**

`searchVenues`를 모듈 mock하여 검색 결과를 제어. 5개 스토리: Empty, WithSelectedVenue, Disabled, SearchResults, Loading.

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import VenueField from './VenueField';

const meta: Meta<typeof VenueField> = {
    title: 'Dashboard/SharedFields/VenueField',
    component: VenueField,
    decorators: [
        (Story) => (
            <div className="w-80 rounded-lg border border-dashboard-border bg-dashboard-bg-card p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        onChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof VenueField>;

export const Empty: Story = {
    args: {
        value: { name: '' },
        placeholder: 'Search venue...',
    },
};

export const WithSelectedVenue: Story = {
    args: {
        value: { id: 'venue-1', name: 'Berghain' },
    },
};

export const Disabled: Story = {
    args: {
        value: { id: 'venue-1', name: 'Berghain' },
        disabled: true,
    },
};

export const WithFreeText: Story = {
    args: {
        value: { name: 'Some custom venue' },
    },
};

export const WithCustomPlaceholder: Story = {
    args: {
        value: { name: '' },
        placeholder: 'Type to search venues...',
    },
};
```

**Step 2: Storybook 확인**

Run: `pnpm storybook` → Dashboard/SharedFields/VenueField 확인

**Step 3: Commit**

```
test(VenueField): add Storybook stories
```
