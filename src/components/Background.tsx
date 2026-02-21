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
        <div className="relative min-h-0 flex-1">
            <div className="fixed inset-0 z-0">
                <Image
                    src={src}
                    alt=""
                    fill
                    priority={priority}
                    quality={85}
                    sizes="100vw"
                    style={{
                        objectFit: size,
                        objectPosition: position,
                        filter: blur ? `blur(${blur}px)` : 'none',
                    }}
                />
                {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
            </div>

            <div className="relative z-10">{children}</div>
        </div>
    );
}
