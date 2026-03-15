'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PreviewMessageListener() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPreview = searchParams.get('preview') === 'true';

    useEffect(() => {
        if (!isPreview) return;

        // Hide scrollbar in preview mode
        document.documentElement.classList.add('scrollbar-hide');
        return () => document.documentElement.classList.remove('scrollbar-hide');
    }, [isPreview]);

    useEffect(() => {
        if (!isPreview) return;

        const handler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (typeof event.data !== 'object' || event.data?.type !== 'refresh') return;
            router.refresh();
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [isPreview, router]);

    return null;
}
