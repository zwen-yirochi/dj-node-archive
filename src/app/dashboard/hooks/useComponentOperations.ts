// app/dashboard/hooks/useComponentOperations.ts
import { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useComponentOperations(
    components: ComponentData[],
    onComponentsChange: (components: ComponentData[]) => void,
    selectedComponentId: string | null,
    setSelectedComponentId: (id: string | null) => void,
    pageId: string
) {
    const componentsRef = useRef(components);
    componentsRef.current = components;

    // ✓ addComponent 추가
    const addComponent = useCallback(
        async (type: 'show' | 'mixset' | 'link') => {
            const id = uuidv4();
            let newComponent: ComponentData;

            switch (type) {
                case 'show':
                    newComponent = {
                        id,
                        type: 'show',
                        title: '',
                        date: new Date().toISOString().split('T')[0],
                        venue: '',
                        posterUrl: '',
                        lineup: [],
                        description: '',
                        links: [],
                    } as EventComponent;
                    break;
                case 'mixset':
                    newComponent = {
                        id,
                        type: 'mixset',
                        title: '',
                        coverUrl: '',
                        audioUrl: '',
                        soundcloudEmbedUrl: '',
                        tracklist: [],
                        description: '',
                        releaseDate: new Date().toISOString().split('T')[0],
                        genre: '',
                    } as MixsetComponent;
                    break;
                case 'link':
                    newComponent = {
                        id,
                        type: 'link',
                        title: '',
                        url: '',
                        icon: 'globe',
                    } as LinkComponent;
                    break;
            }

            // 낙관적 업데이트
            const updatedComponents = [...componentsRef.current, newComponent];
            onComponentsChange(updatedComponents);
            setSelectedComponentId(id); // ✓ 바로 선택하여 에디터 열기

            // DB 저장
            try {
                const response = await fetch('/api/components', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId, component: newComponent }),
                });

                if (!response.ok) {
                    // 실패 시 롤백
                    onComponentsChange(componentsRef.current.filter((c) => c.id !== id));
                    setSelectedComponentId(null);
                    console.error('컴포넌트 추가 실패');
                }
            } catch (error) {
                // 실패 시 롤백
                onComponentsChange(componentsRef.current.filter((c) => c.id !== id));
                setSelectedComponentId(null);
                console.error('컴포넌트 추가 오류:', error);
            }
        },
        [pageId, onComponentsChange, setSelectedComponentId]
    );

    const updateComponent = useCallback(
        async (id: string, updates: Partial<ComponentData>) => {
            const previousComponent = componentsRef.current.find((c) => c.id === id);
            if (!previousComponent) return;

            const updatedComponent = { ...previousComponent, ...updates } as ComponentData;

            // 낙관적 업데이트
            const updatedComponents = componentsRef.current.map((c) =>
                c.id === id ? updatedComponent : c
            );
            onComponentsChange(updatedComponents);

            // DB 저장
            try {
                const response = await fetch(`/api/components/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ component: updatedComponent }),
                });

                if (!response.ok) {
                    // 실패 시 롤백
                    onComponentsChange(
                        componentsRef.current.map((c) => (c.id === id ? previousComponent : c))
                    );
                    console.error('컴포넌트 수정 실패');
                }
            } catch (error) {
                // 실패 시 롤백
                onComponentsChange(
                    componentsRef.current.map((c) => (c.id === id ? previousComponent : c))
                );
                console.error('컴포넌트 수정 오류:', error);
            }
        },
        [pageId, onComponentsChange]
    );

    const deleteComponent = useCallback(
        async (id: string) => {
            const currentComponents = componentsRef.current;
            const deletedComponent = currentComponents.find((c) => c.id === id);

            if (!deletedComponent) return;

            // 낙관적 업데이트
            onComponentsChange(currentComponents.filter((c) => c.id !== id));

            if (selectedComponentId === id) {
                setSelectedComponentId(null);
            }

            // DB 삭제
            try {
                const response = await fetch(`/api/components/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    // 실패 시 롤백
                    onComponentsChange(currentComponents);
                    console.error('컴포넌트 삭제 실패');
                }
            } catch (error) {
                // 실패 시 롤백
                onComponentsChange(currentComponents);
                console.error('컴포넌트 삭제 오류:', error);
            }
        },
        [pageId, selectedComponentId, onComponentsChange, setSelectedComponentId]
    );

    const duplicateComponent = useCallback(
        async (id: string) => {
            const original = componentsRef.current.find((c) => c.id === id);
            if (!original) return;

            const duplicateId = uuidv4();
            const duplicatedComponent = {
                ...original,
                id: duplicateId,
                title: `${original.title} (복사본)`,
            };

            // 낙관적 업데이트
            const updatedComponents = [...componentsRef.current, duplicatedComponent];
            onComponentsChange(updatedComponents);
            setSelectedComponentId(duplicateId);

            // DB 저장
            try {
                const response = await fetch('/api/components', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId, component: duplicatedComponent }),
                });

                if (!response.ok) {
                    // 실패 시 롤백
                    onComponentsChange(componentsRef.current.filter((c) => c.id !== duplicateId));
                    setSelectedComponentId(null);
                    console.error('컴포넌트 복제 실패');
                }
            } catch (error) {
                // 실패 시 롤백
                onComponentsChange(componentsRef.current.filter((c) => c.id !== duplicateId));
                setSelectedComponentId(null);
                console.error('컴포넌트 복제 오류:', error);
            }
        },
        [pageId, onComponentsChange, setSelectedComponentId]
    );

    return { addComponent, updateComponent, deleteComponent, duplicateComponent };
}
