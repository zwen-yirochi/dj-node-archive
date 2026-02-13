import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    full?: boolean;
    children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
    primary: 'border-cortex-ink text-cortex-ink hover:bg-cortex-ink hover:text-cortex-bg',
    ghost: 'border-cortex-ink-faint text-cortex-ink-light hover:border-cortex-ink-light hover:text-cortex-ink',
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
                'inline-flex cursor-pointer items-center justify-center gap-2 border bg-transparent px-7 py-[11px] font-mono-main text-[10px] font-medium uppercase tracking-cortex-btn no-underline',
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
