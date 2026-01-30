// hooks/useDragAndDrop.ts
import { ComponentData } from '@/types';
import {
    DragEndEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useRef, useState } from 'react';

export function useDragAndDrop(
    components: ComponentData[],
    onComponentsChange: (components: ComponentData[]) => void,
    pageId: string
) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // 최신 components를 참조하기 위한 ref
    const componentsRef = useRef(components);
    componentsRef.current = components;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (!over || active.id === over.id) return;

            const currentComponents = componentsRef.current;
            const oldIndex = currentComponents.findIndex((item) => item.id === active.id);
            const newIndex = currentComponents.findIndex((item) => item.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const newComponents = arrayMove(currentComponents, oldIndex, newIndex);

            // 낙관적 업데이트
            onComponentsChange(newComponents);

            // DB 저장
            try {
                const updates = newComponents.map((comp, index) => ({
                    id: comp.id,
                    position: index,
                }));

                const response = await fetch('/api/components/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates }),
                });

                if (!response.ok) {
                    // 실패 시 롤백
                    onComponentsChange(currentComponents);
                    console.error('컴포넌트 순서 변경 실패');
                }
            } catch (error) {
                // 실패 시 롤백
                onComponentsChange(currentComponents);
                console.error('컴포넌트 순서 변경 오류:', error);
            }
        },
        [pageId, onComponentsChange]
    );

    const activeComponent = activeId
        ? componentsRef.current.find((c) => c.id === activeId)
        : undefined;

    return { sensors, handleDragStart, handleDragEnd, activeComponent };
}
