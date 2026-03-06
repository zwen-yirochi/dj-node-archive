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
