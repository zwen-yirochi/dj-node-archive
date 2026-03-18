import type { RichTextBlockData } from '@/types/domain';

interface RichtextBlockViewProps {
    data: RichTextBlockData;
}

export function RichtextBlockView({ data }: RichtextBlockViewProps) {
    if (!data.content) return null;

    return (
        <div className="py-4">
            <p className="dna-text-body whitespace-pre-wrap leading-relaxed">{data.content}</p>
        </div>
    );
}
