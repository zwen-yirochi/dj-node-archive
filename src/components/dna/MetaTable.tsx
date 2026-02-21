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
                            'dna-border-row border-b',
                            i === items.length - 1 && 'border-b-0'
                        )}
                    >
                        <td className="dna-text-meta w-[140px] py-[7px] pt-[9px] align-top">
                            {item.key}
                        </td>
                        <td className="py-[7px] align-top text-dna-meta-val text-dna-ink">
                            {item.value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
