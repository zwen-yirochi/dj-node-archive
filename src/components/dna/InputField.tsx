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
        'w-full py-[9px] px-3 font-mono-main text-dna-body text-dna-ink bg-white/40 border border-dna-ink-faint outline-none tracking-[0.3px] placeholder:text-dna-ink-ghost focus:border-dna-ink-mid focus:bg-white/60';

    return (
        <div className={cn('mb-3.5', className)}>
            <div className="mb-1.5 flex items-center gap-1.5 text-dna-label uppercase tracking-dna-btn text-dna-ink-light">
                {label}
                {required && <span className="text-dna-system text-dna-accent-red">*</span>}
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

            {hint && <div className="mt-1 text-dna-label text-dna-ink-ghost">{hint}</div>}
        </div>
    );
}
