// components/Background.tsx

interface BackgroundProps {
    src: string;
    position?: string;
    size?: React.CSSProperties['objectFit'];
    overlay?: string | null;
    blur?: number;
    children?: React.ReactNode;
}

export default function Background({
    src,
    position = 'center',
    size = 'cover',
    overlay = null,
    blur = 0,
    children,
}: BackgroundProps) {
    return (
        <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* 이미지 레이어 */}
            <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full"
                style={{
                    objectFit: size,
                    objectPosition: position,
                    filter: blur ? `blur(${blur}px)` : 'none',
                }}
            />

            {/* 오버레이 레이어 */}
            {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}

            {/* 콘텐츠 레이어 */}
            <div className="relative z-10 h-full w-full overflow-y-auto">{children}</div>
        </div>
    );
}
