'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';

import { useUser } from '../hooks';
import { useRegisterPreviewRefresh } from '../hooks/use-preview-refresh';

export default function PreviewPanel() {
    const user = useUser();
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Intersection Observer + 1-second fallback combined
    useEffect(() => {
        if (isVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.01 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        const timer = setTimeout(() => setIsVisible(true), 1000);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [isVisible]);

    // iframe refresh
    const refreshPreview = useCallback(() => {
        if (iframeRef.current?.contentWindow && isVisible) {
            setIsLoading(true);
            iframeRef.current.contentWindow.location.reload();
        }
    }, [isVisible]);

    // mutation onSuccess -> triggerPreviewRefresh() -> this callback executes
    useRegisterPreviewRefresh(refreshPreview);

    const handleIframeLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    const pagePath = `/${user.username}`;

    const handleCopy = async () => {
        try {
            const fullUrl = `${window.location.origin}${pagePath}`;
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const scale = 0.7;
    const deviceWidth = 390;
    const deviceHeight = 844;
    const scaledWidth = deviceWidth * scale;
    const scaledHeight = deviceHeight * scale;

    return (
        <div ref={containerRef} className="mr-6 flex h-full flex-col items-center py-4">
            {/* Link + copy button */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Link
                    href={`/${user.username}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <span className="font-mono text-xs">{pagePath}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </Link>
                <div className="h-4 w-px bg-border" />
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                        <Copy className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            {/* iPhone frame */}
            <div className="relative flex flex-1 items-start justify-center">
                <div
                    className="relative rounded-[35px] bg-stone-900 p-2 shadow-2xl"
                    style={{
                        width: `${scaledWidth + 16}px`,
                    }}
                >
                    {/* Notch */}
                    <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-stone-900" />

                    {/* Screen area */}
                    <div
                        className="relative overflow-hidden rounded-[27px] bg-white"
                        style={{
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                        }}
                    >
                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                            </div>
                        )}

                        {/* iframe */}
                        <div
                            style={{
                                width: `${deviceWidth}px`,
                                height: `${deviceHeight}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {isVisible ? (
                                <iframe
                                    ref={iframeRef}
                                    src={`/${user.username}?preview=true`}
                                    className="h-full w-full border-0"
                                    title="Page preview"
                                    onLoad={handleIframeLoad}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-neutral-50">
                                    <p className="text-xs text-neutral-400">Loading preview...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
