import { useCallback, useEffect, useRef, useState } from 'react';

interface ScrollState {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    /** 0–1 progress through scroll range */
    progress: number;
}

interface UseHorizontalScrollReturn {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    state: ScrollState;
    scroll: (dir: 'left' | 'right') => void;
}

interface Options {
    /** Scroll amount as fraction of container width (default 0.7) */
    scrollFraction?: number;
    /** Enable vertical wheel → horizontal scroll conversion (default true) */
    wheelToScroll?: boolean;
    /** Wheel sensitivity multiplier (default 0.5) */
    wheelMultiplier?: number;
}

export function useHorizontalScroll(options?: Options): UseHorizontalScrollReturn {
    const { scrollFraction = 0.7, wheelToScroll = true, wheelMultiplier = 0.5 } = options ?? {};

    const scrollRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<ScrollState>({
        canScrollLeft: false,
        canScrollRight: false,
        progress: 0,
    });

    const update = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setState({
            canScrollLeft: el.scrollLeft > 2,
            canScrollRight: el.scrollLeft < maxScroll - 2,
            progress: maxScroll > 0 ? el.scrollLeft / maxScroll : 0,
        });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        update();
        el.addEventListener('scroll', update, { passive: true });
        const ro = new ResizeObserver(update);
        ro.observe(el);

        // Wheel → horizontal scroll
        let onWheel: ((e: WheelEvent) => void) | undefined;
        if (wheelToScroll) {
            onWheel = (e: WheelEvent) => {
                if (e.deltaY === 0) return;
                e.preventDefault();
                el.scrollLeft += e.deltaY * wheelMultiplier;
            };
            el.addEventListener('wheel', onWheel, { passive: false });
        }

        return () => {
            el.removeEventListener('scroll', update);
            ro.disconnect();
            if (onWheel) el.removeEventListener('wheel', onWheel);
        };
    }, [update, wheelToScroll, wheelMultiplier]);

    const scroll = useCallback(
        (dir: 'left' | 'right') => {
            const el = scrollRef.current;
            if (!el) return;
            const amount = el.clientWidth * scrollFraction;
            el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
        },
        [scrollFraction]
    );

    return { scrollRef, state, scroll };
}
