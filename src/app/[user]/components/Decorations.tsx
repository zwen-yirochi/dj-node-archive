// ============================================
// Crosshair
// ============================================
interface CrosshairProps {
    position: 'right' | 'center';
}

export function Crosshair({ position }: CrosshairProps) {
    return (
        <div
            className={`relative flex h-6 animate-fade-in-slow items-center px-5 ${
                position === 'right' ? 'justify-end' : 'justify-center'
            }`}
        >
            <div className="before:bg-black/12 after:bg-black/12 relative h-3 w-3 before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:content-[''] after:absolute after:left-1/2 after:top-0 after:h-3 after:w-px after:content-['']">
                <div className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/15" />
            </div>
        </div>
    );
}

// ============================================
// ScanLine
// ============================================
interface ScanLineProps {
    delay?: number;
}

export function ScanLine({ delay = 0 }: ScanLineProps) {
    return (
        <div className="relative flex h-1 items-center gap-2 px-1">
            <div
                className="h-px flex-1 origin-left animate-draw-line bg-black/15"
                style={{ animationDelay: `${delay}s` }}
            />
            <div
                className="h-[3px] w-[3px] animate-dot-appear rounded-full bg-black/15"
                style={{ animationDelay: `${delay + 0.6}s` }}
            />
            <div
                className="h-px flex-1 origin-left animate-draw-line bg-black/15"
                style={{ animationDelay: `${delay + 0.1}s` }}
            />
            <div
                className="h-[3px] w-[3px] animate-dot-appear rounded-full bg-black/15"
                style={{ animationDelay: `${delay + 0.6}s` }}
            />
        </div>
    );
}

// ============================================
// SectionMarker
// ============================================
interface SectionMarkerProps {
    number: string;
    offset: number;
}

export function SectionMarker({ number, offset }: SectionMarkerProps) {
    return (
        <div
            className="animate-slide-down py-8 pl-1"
            style={{ animationDelay: `${0.4 + offset * 0.2}s` }}
        >
            <div className="mt-2 flex flex-col gap-0.5">
                <div className="text-[8px] uppercase tracking-[0.1em] text-black">SEC</div>
                <div className="text-[8px] uppercase tracking-[0.1em] text-black">IDX.{number}</div>
            </div>
            <div className="border-t-black/8 mt-2 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent" />
        </div>
    );
}
