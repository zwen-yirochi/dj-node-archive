import type { KeyValueBlockData } from '@/types/domain';
import { MetaTable } from '@/components/dna/MetaTable';

interface KeyvalueBlockViewProps {
    data: KeyValueBlockData;
}

export function KeyvalueBlockView({ data }: KeyvalueBlockViewProps) {
    if (!data.items || data.items.length === 0) return null;

    return (
        <div className="py-4">
            <MetaTable items={data.items.map((item) => ({ key: item.key, value: item.value }))} />
        </div>
    );
}
