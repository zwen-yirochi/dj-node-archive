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

    if (copied) {
        return (
            <span className="text-cortex-label uppercase tracking-cortex-system text-cortex-ink-ghost">
                // COPIED
            </span>
        );
    }

    return (
        <button
            className="cursor-pointer border border-cortex-ink-faint bg-transparent px-3 py-1.5 font-mono-main text-[10px] uppercase tracking-cortex-btn text-cortex-ink-light hover:border-cortex-ink-light hover:text-cortex-ink"
            onClick={handleShare}
            type="button"
        >
            SHARE
        </button>
    );
}
