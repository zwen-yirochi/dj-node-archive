import { MetaTable } from '@/components/dna/MetaTable';
import { SectionLabel } from '@/components/dna/SectionLabel';

interface MetaItem {
    key: string;
    value: string;
    href?: string;
}

interface MetaSectionProps {
    label: string;
    labelRight?: string;
    items: MetaItem[];
}

export function MetaSection({ label, labelRight, items }: MetaSectionProps) {
    if (items.length === 0) return null;

    return (
        <div>
            <SectionLabel right={labelRight}>{label}</SectionLabel>
            <MetaTable items={items} />
        </div>
    );
}
