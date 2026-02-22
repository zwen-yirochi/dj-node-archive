'use client';

import { useEffect, useState, type ReactNode } from 'react';

const MD_BREAKPOINT = 768;

export default function DesktopOnly({ children }: { children: ReactNode }) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
        setIsDesktop(mql.matches);

        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    if (!isDesktop) return null;
    return <>{children}</>;
}
