import { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useComponentOperations(
    components: ComponentData[],
    setComponents: React.Dispatch<React.SetStateAction<ComponentData[]>>,
    selectedComponentId: string | null,
    setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>,
    pageId: string | null
) {
    // 최신 components를 참조하기 위한 ref
    const componentsRef = useRef(components);
    componentsRef.current = components;

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
            setComponents((prev) => [...prev, newComponent]);
            setSelectedComponentId(id);

            // DB 저장
            if (pageId) {
                try {
                    const response = await fetch('/api/components', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pageId, component: newComponent }),
                    });

                    if (!response.ok) {
                        // 실패 시 롤백
                        setComponents((prev) => prev.filter((c) => c.id !== id));
                        setSelectedComponentId(null);
                        console.error('컴포넌트 추가 실패');
                    }
                } catch (error) {
                    // 실패 시 롤백
                    setComponents((prev) => prev.filter((c) => c.id !== id));
                    setSelectedComponentId(null);
                    console.error('컴포넌트 추가 오류:', error);
                }
            }
        },
        [pageId, setComponents, setSelectedComponentId]
    );

    const updateComponent = useCallback(
        async (id: string, updates: Partial<ComponentData>) => {
            // 이전 상태 저장 (롤백용) - ref에서 직접 가져옴
            const previousComponent = componentsRef.current.find((c) => c.id === id);
            if (!previousComponent) return;

            const updatedComponent = { ...previousComponent, ...updates } as ComponentData;

            // 낙관적 업데이트
            setComponents((prev) => prev.map((c) => (c.id === id ? updatedComponent : c)));

            // DB 저장
            if (pageId) {
                try {
                    const response = await fetch(`/api/components/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ component: updatedComponent }),
                    });

                    if (!response.ok) {
                        // 실패 시 롤백
                        setComponents((prev) =>
                            prev.map((c) => (c.id === id ? previousComponent : c))
                        );
                        console.error('컴포넌트 수정 실패');
                    }
                } catch (error) {
                    // 실패 시 롤백
                    setComponents((prev) => prev.map((c) => (c.id === id ? previousComponent : c)));
                    console.error('컴포넌트 수정 오류:', error);
                }
            }
        },
        [pageId, setComponents]
    );

    const deleteComponent = useCallback(
        async (id: string) => {
            // 이전 상태 저장 (롤백용)
            const currentComponents = componentsRef.current;
            const deletedIndex = currentComponents.findIndex((c) => c.id === id);
            const deletedComponent = currentComponents[deletedIndex];

            if (!deletedComponent || deletedIndex === -1) return;

            // 낙관적 업데이트
            setComponents((prev) => prev.filter((c) => c.id !== id));

            if (selectedComponentId === id) {
                setSelectedComponentId(null);
            }

            // DB 삭제
            if (pageId) {
                try {
                    const response = await fetch(`/api/components/${id}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        // 실패 시 롤백
                        setComponents((prev) => {
                            const newComponents = [...prev];
                            newComponents.splice(deletedIndex, 0, deletedComponent);
                            return newComponents;
                        });
                        console.error('컴포넌트 삭제 실패');
                    }
                } catch (error) {
                    // 실패 시 롤백
                    setComponents((prev) => {
                        const newComponents = [...prev];
                        newComponents.splice(deletedIndex, 0, deletedComponent);
                        return newComponents;
                    });
                    console.error('컴포넌트 삭제 오류:', error);
                }
            }
        },
        [pageId, selectedComponentId, setComponents, setSelectedComponentId]
    );

    return { addComponent, updateComponent, deleteComponent };
}
