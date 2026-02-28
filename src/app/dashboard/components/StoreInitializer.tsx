// app/dashboard/components/StoreInitializer.tsx
'use client';

import { useLayoutEffect, useRef } from 'react';

import type { EditorData } from '@/lib/services/user.service';

import { useEntries, useUserQuery } from '../hooks/use-editor-data';
import { useDashboardStore } from '../stores/dashboardStore';

interface StoreInitializerProps {
    initialData: EditorData;
}

export default function StoreInitializer({ initialData }: StoreInitializerProps) {
    const initialized = useRef(false);

    // TanStack Query hydration: SSR 데이터를 분리된 캐시에 주입
    useEntries(initialData.contentEntries);
    useUserQuery(initialData.user);

    // UI Store 초기화 + pageId 설정
    useLayoutEffect(() => {
        if (!initialized.current) {
            useDashboardStore.getState().reset();
            useDashboardStore.getState().setPageId(initialData.pageId);
            initialized.current = true;
        }
    }, [initialData]);

    return null;
}
