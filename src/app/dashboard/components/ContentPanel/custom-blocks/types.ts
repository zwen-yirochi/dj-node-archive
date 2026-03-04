import type { SectionBlockDataMap, SectionBlockType } from '@/types';

/** Props passed to each section block editor component */
export interface SectionBlockEditorProps<T extends SectionBlockType> {
    data: SectionBlockDataMap[T];
    onChange: (data: SectionBlockDataMap[T]) => void;
    disabled?: boolean;
}
