import type { HeaderBlockData } from '@/types/domain';

interface HeaderBlockViewProps {
    data: HeaderBlockData;
}

export function HeaderBlockView({ data }: HeaderBlockViewProps) {
    return (
        <div className="py-4">
            <h2 className="tracking-dna-heading text-lg font-semibold uppercase">{data.title}</h2>
            {data.subtitle && (
                <p className="mt-1 text-dna-meta-val text-dna-ink-light">{data.subtitle}</p>
            )}
        </div>
    );
}
