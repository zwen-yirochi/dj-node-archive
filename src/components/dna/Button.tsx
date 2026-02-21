import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    full?: boolean;
    children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
    primary: 'border-dna-ink text-dna-ink hover:bg-dna-ink hover:text-dna-bg',
    ghost: 'border-dna-ink-faint text-dna-ink-light hover:border-dna-ink-light hover:text-dna-ink',
};

export function Button({
    variant = 'primary',
    full = false,
    children,
    className,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-2 border bg-transparent px-7 py-[11px] font-mono-main text-[10px] font-medium uppercase tracking-dna-btn no-underline',
                variants[variant],
                full && 'w-full',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
