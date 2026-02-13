'use client';

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useCallback, useState } from 'react';

const pulse = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 2px;
    cursor: pointer;
    font-family: inherit;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b6b6b;
    transition: all 0.2s ease;

    &:hover {
        border-color: rgba(0, 0, 0, 0.25);
        color: #1a1a1a;
    }

    &:active {
        animation: ${pulse} 0.2s ease;
    }
`;

const Copied = styled.span`
    font-size: 10px;
    color: #999;
    letter-spacing: 0.06em;
`;

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
        return <Copied>COPIED</Copied>;
    }

    return (
        <Button onClick={handleShare} type="button">
            <ShareIcon />
            SHARE
        </Button>
    );
}
