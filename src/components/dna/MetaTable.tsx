import { cn } from '@/lib/utils';

interface MetaValue {
    text: string;
    href?: string;
}

interface MetaItem {
    key: string;
    value?: string;
    href?: string;
    /** Multiple values in one row */
    values?: MetaValue[];
}

interface MetaTableProps {
    items: MetaItem[];
    className?: string;
}

export function MetaTable({ items, className }: MetaTableProps) {
    return (
        <table className={cn('my-3 w-full border-collapse', className)}>
            <tbody>
                {items.map((item, i) => (
                    <tr
                        key={i}
                        className={cn(
                            'dna-border-row border-b',
                            i === items.length - 1 && 'border-b-0'
                        )}
                    >
                        <td className="dna-text-meta w-[140px] py-[7px] pt-[9px] align-top">
                            {item.key}
                        </td>
                        <td className="py-[7px] align-top text-dna-meta-val text-dna-ink">
                            {item.values ? (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {item.values.map((v, j) =>
                                        v.href ? (
                                            <a
                                                key={j}
                                                href={v.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dna-border-relation border-b pb-px hover:border-dna-ink hover:text-dna-ink"
                                            >
                                                {v.text}
                                            </a>
                                        ) : (
                                            <span key={j}>{v.text}</span>
                                        )
                                    )}
                                </div>
                            ) : item.href ? (
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="dna-border-relation border-b pb-px hover:border-dna-ink hover:text-dna-ink"
                                >
                                    {item.value}
                                </a>
                            ) : (
                                item.value
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
