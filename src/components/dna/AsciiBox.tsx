import { cn } from '@/lib/utils';

interface AsciiBoxProps {
    children: React.ReactNode;
    className?: string;
    repeat?: number;
}

export function AsciiBox({ children, className, repeat = 40 }: AsciiBoxProps) {
    const border = '- '.repeat(repeat);
    return (
        <div className={cn('my-7', className)}>
            <div className="select-none overflow-hidden whitespace-pre text-dna-meta-val leading-none text-dna-ink-ghost">
                {`/${border}\\`}
            </div>
            <div className="dna-border-structure border-l border-r px-7 py-5">{children}</div>
            <div className="select-none overflow-hidden whitespace-pre text-dna-meta-val leading-none text-dna-ink-ghost">
                {`\\${border}/`}
            </div>
        </div>
    );
}
