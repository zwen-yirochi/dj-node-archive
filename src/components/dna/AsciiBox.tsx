import { cn } from '@/lib/utils';

interface AsciiBoxProps {
    children: React.ReactNode;
    className?: string;
}

export function AsciiBox({ children, className }: AsciiBoxProps) {
    return (
        <div className={cn('my-7', className)}>
            <div className="select-none overflow-hidden whitespace-pre text-dna-meta-val leading-none text-dna-ink-ghost">
                {
                    '/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\\'
                }
            </div>
            <div className="border-l border-r border-dashed border-dna-ink-ghost px-7 py-5">
                {children}
            </div>
            <div className="select-none overflow-hidden whitespace-pre text-dna-meta-val leading-none text-dna-ink-ghost">
                {
                    '\\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -/'
                }
            </div>
        </div>
    );
}
