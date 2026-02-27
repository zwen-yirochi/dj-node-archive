// app/dashboard/components/StoreInitializer.tsx
'use client';

import { useEditorData } from '../hooks';
import type { EditorData } from '@/lib/services/user.service';
import { useDashboardStore } from '../stores/dashboardStore';
import { useUserStore } from '@/stores/userStore';
import { useLayoutEffect, useRef } from 'react';

interface StoreInitializerProps {
    initialData: EditorData;
}

export default function StoreInitializer({ initialData }: StoreInitializerProps) {
    const initialized = useRef(false);

    // TanStack Query hydration: SSR 데이터를 initialData로 전달
    useEditorData(initialData);

    // User Store + UI Store 초기화 (entries는 TanStack Query에서 관리)
    useLayoutEffect(() => {
        if (!initialized.current) {
            useUserStore.setState({ user: initialData.user });
            useDashboardStore.getState().reset();
            initialized.current = true;
        }
    }, [initialData]);

    return null;
}
