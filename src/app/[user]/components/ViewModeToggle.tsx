// components/ViewModeToggle.tsx
'use client';

import { Button } from '@/components/ui/button';

interface ViewModeToggleProps {
    viewMode: 'list' | 'grid';
    onViewModeChange: (mode: 'list' | 'grid') => void;
}

export default function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
    return (
        <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewModeChange('list')}
                className={`rounded-md transition-all ${
                    viewMode === 'list'
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="리스트 뷰"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewModeChange('grid')}
                className={`rounded-md transition-all ${
                    viewMode === 'grid'
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="그리드 뷰"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                </svg>
            </Button>
        </div>
    );
}
