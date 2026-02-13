import { cn } from '@/lib/utils';

interface InputFieldProps {
    label: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export function InputField({
    label,
    required = false,
    hint,
    placeholder,
    multiline = false,
    className,
    value,
    onChange,
}: InputFieldProps) {
    const inputClasses =
        'w-full py-[9px] px-3 font-mono-main text-cortex-body text-cortex-ink bg-white/40 border border-cortex-ink-faint outline-none tracking-[0.3px] placeholder:text-cortex-ink-ghost focus:border-cortex-ink-mid focus:bg-white/60';

    return (
        <div className={cn('mb-3.5', className)}>
            <div className="mb-1.5 flex items-center gap-1.5 text-cortex-label uppercase tracking-cortex-btn text-cortex-ink-light">
                {label}
                {required && <span className="text-cortex-system text-cortex-accent-red">*</span>}
            </div>

            {multiline ? (
                <textarea
                    className={cn(inputClasses, 'min-h-[80px] resize-y leading-relaxed')}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className={inputClasses}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            )}

            {hint && <div className="mt-1 text-cortex-label text-cortex-ink-ghost">{hint}</div>}
        </div>
    );
}
