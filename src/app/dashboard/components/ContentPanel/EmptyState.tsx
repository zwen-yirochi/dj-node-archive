'use client';

import { MousePointerClick } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <MousePointerClick className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-white/80">컴포넌트를 선택하세요</h3>
            <p className="max-w-xs text-sm text-white/50">
                왼쪽 사이드바에서 컴포넌트를 클릭하면 상세 정보를 확인하고 편집할 수 있습니다.
            </p>
        </div>
    );
}
