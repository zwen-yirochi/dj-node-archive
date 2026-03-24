import { cn } from '@/lib/utils';

interface NodeLabelProps {
    children: React.ReactNode;
    right?: string;
    className?: string;
}

export function NodeLabel({ children, right, className }: NodeLabelProps) {
    return (
        <div className={cn('dna-text-node hidden items-center gap-2.5 md:flex', className)}>
            <span>{children}</span>
            <span className="dna-border-relation h-0 flex-1 border-t" />
            {right && <span>{right}</span>}
        </div>
    );
}
