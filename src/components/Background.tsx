// components/Background.tsx
import Image from 'next/image';

interface BackgroundProps {
    src: string;
    position?: string;
    size?: React.CSSProperties['objectFit'];
    overlay?: string | null;
    blur?: number;
    children?: React.ReactNode;
    priority?: boolean; // ← 추가
}

export default function Background({
    src,
    position = 'center',
    size = 'cover',
    overlay = null,
    blur = 0,
    children,
    priority = false, // ← LCP 이미지인 경우 true
}: BackgroundProps) {
    return (
        <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Next.js Image로 변경 */}
            <Image
                src={src}
                alt=""
                fill // ← absolute + inset-0 대체
                priority={priority} // ← LCP 이미지 우선 로드
                quality={85} // ← 품질 조정
                sizes="100vw" // ← 뷰포트 전체
                style={{
                    objectFit: size,
                    objectPosition: position,
                    filter: blur ? `blur(${blur}px)` : 'none',
                }}
            />

            {overlay && <div className="absolute inset-0 z-[1]" style={{ background: overlay }} />}

            <div className="relative z-10 h-full w-full overflow-y-auto">{children}</div>
        </div>
    );
}
