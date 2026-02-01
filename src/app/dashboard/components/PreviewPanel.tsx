'use client';

import { useEditorStore } from '@/stores/editorStore';
import { Check, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PreviewPanel() {
    const user = useEditorStore((state) => state.user);
    const components = useEditorStore((state) => state.components);
    const [refreshKey, setRefreshKey] = useState(0);
    const [copied, setCopied] = useState(false);

    // 컴포넌트가 변경되면 자동으로 새로고침
    useEffect(() => {
        setRefreshKey((prev) => prev + 1);
    }, [components]);

    if (!user?.username) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
            </div>
        );
    }

    const pageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${user.username}`;
    const displayUrl = pageUrl.replace(/^https?:\/\//, '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('복사 실패:', error);
        }
    };

    // 0.7배 스케일
    const scale = 0.7;
    const deviceWidth = 390;
    const deviceHeight = 844;
    const scaledWidth = deviceWidth * scale;
    const scaledHeight = deviceHeight * scale;

    return (
        <div className="flex h-full flex-col items-center py-4">
            {/* 링크 + 복사 버튼 */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Link
                    href={`/${user.username}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <span className="font-mono text-xs">{displayUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </Link>
                <div className="h-4 w-px bg-border" />
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                        </>
                    )}
                </button>
            </div>

            {/* iPhone 프레임 (0.7배 스케일) */}
            <div className="relative flex flex-1 items-start justify-center">
                {/* 아이폰 외부 프레임 */}
                <div
                    className="relative rounded-[35px] bg-stone-900 p-2 shadow-2xl"
                    style={{
                        width: `${scaledWidth + 16}px`,
                    }}
                >
                    {/* 노치 */}
                    <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-stone-900" />

                    {/* 화면 영역 */}
                    <div
                        className="relative overflow-hidden rounded-[27px] bg-white"
                        style={{
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                        }}
                    >
                        {/* iframe을 transform으로 스케일링 */}
                        <div
                            style={{
                                width: `${deviceWidth}px`,
                                height: `${deviceHeight}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <iframe
                                key={refreshKey}
                                src={`/${user.username}?preview=true`}
                                className="h-full w-full border-0"
                                title="페이지 미리보기"
                            />
                        </div>
                    </div>

                    {/* 하단 홈 인디케이터 */}
                    <div className="absolute bottom-1.5 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-stone-700" />
                </div>
            </div>
        </div>
    );
}
