import { ComponentData, EventComponent, LinkComponent, MixsetComponent } from '@/types';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useComponentOperations(
    components: ComponentData[],
    setComponents: React.Dispatch<React.SetStateAction<ComponentData[]>>,
    selectedComponentId: string | null,
    setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>
) {
    const addComponent = useCallback((type: 'show' | 'mixset' | 'link') => {
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

        setComponents((prev) => [...prev, newComponent]);
        setSelectedComponentId(id);
    }, []);

    const updateComponent = useCallback((id: string, updates: Partial<ComponentData>) => {
        setComponents((prev) =>
            prev.map((c) => (c.id === id ? ({ ...c, ...updates } as ComponentData) : c))
        );
    }, []);

    const deleteComponent = useCallback(
        (id: string) => {
            setComponents((prev) => prev.filter((c) => c.id !== id));
            if (selectedComponentId === id) {
                setSelectedComponentId(null);
            }
        },
        [selectedComponentId]
    );

    return { addComponent, updateComponent, deleteComponent };
}
