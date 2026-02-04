'use client';

import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    /** 호버 후 툴팁 표시까지의 지연 시간 (ms) */
    delay?: number;
    className?: string;
}

/**
 * 간단한 툴팁 컴포넌트
 * - 지정된 delay 후 툴팁 표시
 * - 마우스 떠나면 즉시 숨김
 */
export function Tooltip({ children, content, delay = 300, className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible && (
                <div
                    className={cn(
                        'absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
                        'animate-in fade-in-0 zoom-in-95',
                        className
                    )}
                >
                    {content}
                    {/* 화살표 */}
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
                </div>
            )}
        </div>
    );
}
