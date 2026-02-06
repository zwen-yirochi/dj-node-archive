'use client';

import { useContentEntryStore } from '@/stores/contentEntryStore';
import { useUserStore } from '@/stores/userStore';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';

export default function PreviewPanel() {
    const user = useUserStore((state) => state.user);
    // previewVersion만 구독 - 조건부 새로고침
    // Display 변경, 완성된 엔트리 변경, 삭제 시에만 증가
    const previewVersion = useContentEntryStore((state) => state.previewVersion);
    const [copied, setCopied] = useState(false);

    // 깜빡임 방지를 위한 이중 버퍼링 상태
    const [displayedVersion, setDisplayedVersion] = useState(previewVersion);
    const [isLoading, setIsLoading] = useState(false);
    const pendingVersionRef = useRef(previewVersion);

    // previewVersion이 변경되면 로딩 시작
    useEffect(() => {
        if (previewVersion !== displayedVersion) {
            pendingVersionRef.current = previewVersion;
            setIsLoading(true);
        }
    }, [previewVersion, displayedVersion]);

    // iframe 로드 완료 시 호출
    const handleIframeLoad = useCallback(() => {
        // 로딩 중인 버전이 현재 대기 중인 버전과 같으면 표시
        setDisplayedVersion(pendingVersionRef.current);
        setIsLoading(false);
    }, []);

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
        <div className="mr-6 flex h-full flex-col items-center py-4">
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
                        {/* 로딩 인디케이터 */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                            </div>
                        )}

                        {/* iframe을 transform으로 스케일링 */}
                        <div
                            style={{
                                width: `${deviceWidth}px`,
                                height: `${deviceHeight}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {/* 현재 표시 중인 iframe (안정적으로 보이는 버전) */}
                            <iframe
                                key={displayedVersion}
                                src={`/${user.username}?preview=true`}
                                className="h-full w-full border-0"
                                title="페이지 미리보기"
                            />

                            {/* 새 버전 로딩 중인 숨겨진 iframe */}
                            {isLoading && previewVersion !== displayedVersion && (
                                <iframe
                                    key={previewVersion}
                                    src={`/${user.username}?preview=true&v=${previewVersion}`}
                                    className="absolute left-0 top-0 h-full w-full border-0 opacity-0"
                                    title="페이지 미리보기 (로딩 중)"
                                    onLoad={handleIframeLoad}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
