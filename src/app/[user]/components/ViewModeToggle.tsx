// components/ViewModeToggle.tsx
'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface ViewModeToggleProps {
    viewMode: 'list' | 'grid';
}

export default function ViewModeToggle({ viewMode }: ViewModeToggleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleViewChange = useCallback(
        (mode: 'list' | 'grid') => {
            // 기존 searchParams 유지하면서 view만 변경
            const params = new URLSearchParams(searchParams.toString());
            params.set('view', mode);

            // 스크롤 위치 유지하면서 URL 변경
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewChange('list')}
                className={`rounded-md transition-all ${
                    viewMode === 'list'
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="리스트 뷰"
            >
                <List className="h-5 w-5" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewChange('grid')}
                className={`rounded-md transition-all ${
                    viewMode === 'grid'
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="그리드 뷰"
            >
                <LayoutGrid className="h-5 w-5" />
            </Button>
        </div>
    );
}
