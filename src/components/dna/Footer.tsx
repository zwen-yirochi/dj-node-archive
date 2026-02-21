import { cn } from '@/lib/utils';

interface FooterProps {
    meta: string[];
    ascii?: string;
    bottom: { left: string; center?: string; right: string };
    className?: string;
}

export function Footer({ meta, ascii, bottom, className }: FooterProps) {
    return (
        <footer className={cn('mt-5 border-t border-dashed border-dna-ink-ghost py-7', className)}>
            <div className="flex items-start justify-between">
                <div className="text-dna-system leading-[2] tracking-dna-system text-dna-ink-ghost">
                    {meta.map((line, i) => (
                        <span key={i}>
                            {line}
                            {i < meta.length - 1 && <br />}
                        </span>
                    ))}
                </div>

                {ascii && (
                    <div className="whitespace-pre text-right text-[10px] leading-[1.3] text-dna-ink-ghost">
                        {ascii}
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-between border-t border-dotted border-dna-ink-faint pt-3 text-dna-system uppercase tracking-dna-meta text-dna-ink-ghost">
                <span>{bottom.left}</span>
                {bottom.center && <span>{bottom.center}</span>}
                <span>{bottom.right}</span>
            </div>
        </footer>
    );
}
