'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useEffect, useState } from 'react';

export default function PreviewPanel() {
    const user = useEditorStore((state) => state.user);
    const components = useEditorStore((state) => state.components);
    const [refreshKey, setRefreshKey] = useState(0);

    // 컴포넌트가 변경되면 자동으로 새로고침
    useEffect(() => {
        setRefreshKey((prev) => prev + 1);
    }, [components]);

    if (!user?.username) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-stone-500">사용자 정보를 불러오는 중...</p>
            </div>
        );
    }

    // 0.7배 스케일
    const scale = 0.7;
    const deviceWidth = 390;
    const deviceHeight = 844;
    const scaledWidth = deviceWidth * scale;
    const scaledHeight = deviceHeight * scale;

    return (
        <div className="flex h-full flex-col items-center justify-center py-4">
            {/* iPhone 프레임 (0.7배 스케일) */}
            <div className="relative">
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
