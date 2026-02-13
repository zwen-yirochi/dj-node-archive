import { cn } from '@/lib/utils';

interface MetaItem {
    key: string;
    value: string;
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
                            'border-b border-dotted border-cortex-ink-faint',
                            i === items.length - 1 && 'border-b-0'
                        )}
                    >
                        <td className="w-[140px] py-[7px] pt-[9px] align-top text-cortex-label uppercase tracking-cortex-meta text-cortex-ink-light">
                            {item.key}
                        </td>
                        <td className="py-[7px] align-top text-cortex-meta-val text-cortex-ink">
                            {item.value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
