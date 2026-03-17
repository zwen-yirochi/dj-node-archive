import type { ImageBlockData } from '@/types/domain';

interface ImageBlockViewProps {
    data: ImageBlockData;
}

export function ImageBlockView({ data }: ImageBlockViewProps) {
    if (!data.url) return null;

    return (
        <div className="py-4">
            <div className="overflow-hidden border border-dna-ink-faint">
                <img src={data.url} alt={data.alt || ''} className="w-full object-contain" />
            </div>
            {data.caption && (
                <p className="mt-2 text-dna-label text-dna-ink-light">{data.caption}</p>
            )}
        </div>
    );
}
