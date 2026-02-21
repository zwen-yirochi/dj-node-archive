import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageFrameProps {
    src: string;
    alt: string;
    meta?: { left: string; right: string };
    className?: string;
    priority?: boolean;
}

export function ImageFrame({ src, alt, meta, className, priority = false }: ImageFrameProps) {
    return (
        <div
            className={cn(
                'relative aspect-[4/5] w-full overflow-hidden border border-dna-ink-faint bg-dna-bg-dark',
                className
            )}
        >
            <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                className="object-cover mix-blend-multiply brightness-[1.05] contrast-[1.1] grayscale-[85%]"
            />

            {/* Duotone overlay */}
            <div
                className="pointer-events-none absolute inset-0 mix-blend-color"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(34,85,170,0.12) 0%, rgba(192,57,43,0.08) 100%)',
                }}
            />

            {/* Corner marks */}
            <div className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 border-l border-t border-dna-ink-ghost" />
            <div className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 border-r border-t border-dna-ink-ghost" />
            <div className="pointer-events-none absolute bottom-7 left-1.5 h-4 w-4 border-b border-l border-dna-ink-ghost" />
            <div className="pointer-events-none absolute bottom-7 right-1.5 h-4 w-4 border-b border-r border-dna-ink-ghost" />

            {/* Meta bar */}
            {meta && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-between border-t border-dna-ink-faint bg-dna-bg/85 px-2.5 py-2 text-dna-system uppercase tracking-dna-meta text-dna-ink-light">
                    <span>{meta.left}</span>
                    <span>{meta.right}</span>
                </div>
            )}
        </div>
    );
}
