'use client';

import { useCallback, useState } from 'react';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: do nothing
        }
    }, []);

    return (
        <button
            className="inline-flex h-[28px] w-[72px] cursor-pointer items-center justify-center border border-cortex-ink-faint bg-transparent font-mono-main text-[10px] uppercase tracking-cortex-btn text-cortex-ink-light hover:border-cortex-ink-light hover:text-cortex-ink"
            onClick={handleShare}
            type="button"
        >
            {copied ? 'COPIED' : 'SHARE'}
        </button>
    );
}
