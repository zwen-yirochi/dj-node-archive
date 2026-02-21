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
            className="inline-flex h-[28px] w-[72px] cursor-pointer items-center justify-center border border-dna-ink-faint bg-transparent font-mono-main text-dna-ui uppercase tracking-dna-btn text-dna-ink-light hover:border-dna-ink-light hover:text-dna-ink"
            onClick={handleShare}
            type="button"
        >
            {copied ? 'COPIED' : 'SHARE'}
        </button>
    );
}
