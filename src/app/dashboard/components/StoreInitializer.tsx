// app/dashboard/components/StoreInitializer.tsx
'use client';

import { initializeContentEntryStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import type { ContentEntry, User } from '@/types';
import { useLayoutEffect, useRef } from 'react';

interface StoreInitializerProps {
    user: User;
    entries: ContentEntry[];
    pageId: string;
}

export default function StoreInitializer({ user, entries, pageId }: StoreInitializerProps) {
    const initialized = useRef(false);
    const currentPageId = useRef(pageId);

    // useLayoutEffect 사용 (useEffect보다 먼저 실행, DOM 커밋 전)
    useLayoutEffect(() => {
        if (!initialized.current) {
            // User Store 초기화
            useUserStore.setState({ user });

            // Content Entry Store 초기화
            initializeContentEntryStore({ entries, pageId });

            // UI Store 초기화
            useUIStore.getState().reset();

            currentPageId.current = pageId;
            initialized.current = true;
        }
    }, []); // 빈 배열 - 마운트 시 한 번만

    // pageId 변경 감지
    useLayoutEffect(() => {
        if (initialized.current && currentPageId.current !== pageId) {
            // User Store 업데이트
            useUserStore.setState({ user });

            // Content Entry Store 재초기화
            initializeContentEntryStore({ entries, pageId });

            // UI Store 리셋
            useUIStore.getState().reset();

            currentPageId.current = pageId;
        }
    }, [user, entries, pageId]);

    return null;
}
