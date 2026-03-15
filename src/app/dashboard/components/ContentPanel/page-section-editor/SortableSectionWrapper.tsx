import {
    defaultAnimateLayoutChanges,
    useSortable,
    type AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

import type { Section } from '@/types/domain';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    const { isSorting, wasDragging } = args;
    if (wasDragging) return false;
    if (isSorting) return true;
    return defaultAnimateLayoutChanges(args);
};

interface Props {
    section: Section;
    children: (dragHandleProps: Record<string, unknown>) => ReactNode;
    className?: string;
}

export function SortableSectionWrapper({ section, children, className }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } =
        useSortable({
            id: section.id,
            animateLayoutChanges,
            data: { type: 'section', section },
        });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition: isSorting
            ? 'transform 100ms ease'
            : (transition ?? 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)'),
        ...(isDragging && { opacity: 0, pointerEvents: 'none' }),
    };

    return (
        <div id={`section-${section.id}`} ref={setNodeRef} style={style} className={className}>
            {children({ ...attributes, ...listeners })}
        </div>
    );
}
