'use client';

import { useCallback, useState } from 'react';

const ShareIcon = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
    >
        <path d="M4.5 3L6 1.5L7.5 3" />
        <path d="M6 1.5V7.5" />
        <path d="M2 5.5V9.5C2 10.0523 2.44772 10.5 3 10.5H9C9.55228 10.5 10 10.0523 10 9.5V5.5" />
    </svg>
);

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
        return <span className="text-[10px] tracking-[0.06em] text-[#999]">COPIED</span>;
    }

    return (
        <button
            className="border-black/12 font-inherit flex cursor-pointer items-center gap-1.5 rounded-sm border bg-transparent px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#6b6b6b] transition-all hover:border-black/25 hover:text-[#1a1a1a] active:scale-95"
            onClick={handleShare}
            type="button"
        >
            <ShareIcon />
            SHARE
        </button>
    );
}
