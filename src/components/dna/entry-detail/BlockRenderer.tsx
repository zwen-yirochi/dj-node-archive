import type { ComponentType } from 'react';

import type { ContentBlock, ContentBlockType } from '@/types/domain';

import { EmbedBlockView } from './block-views/EmbedBlockView';
import { HeaderBlockView } from './block-views/HeaderBlockView';
import { ImageBlockView } from './block-views/ImageBlockView';
import { KeyvalueBlockView } from './block-views/KeyvalueBlockView';
import { RichtextBlockView } from './block-views/RichtextBlockView';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockViewMap: Record<ContentBlockType, ComponentType<{ data: any }>> = {
    header: HeaderBlockView,
    richtext: RichtextBlockView,
    image: ImageBlockView,
    embed: EmbedBlockView,
    keyvalue: KeyvalueBlockView,
};

interface BlockRendererProps {
    blocks: ContentBlock[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
    return (
        <>
            {blocks.map((block) => {
                const View = blockViewMap[block.type];
                if (!View) return null;
                return <View key={block.id} data={block.data} />;
            })}
        </>
    );
}
