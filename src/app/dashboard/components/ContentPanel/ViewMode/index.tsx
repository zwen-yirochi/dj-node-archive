'use client';

import { Button } from '@/components/ui/button';
import { COMPONENT_TYPE_CONFIG } from '@/constants/componentConfig';
import { type ComponentData, isEventComponent, isLinkComponent, isMixsetComponent } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';
import LinkDetail from './LinkDetail';
import MixsetDetail from './MixsetDetail';
import ShowDetail from './ShowDetail';

interface ViewModeProps {
    component: ComponentData;
    onEdit: () => void;
    onDelete: () => void;
}

export default function ViewMode({ component, onEdit, onDelete }: ViewModeProps) {
    const config = COMPONENT_TYPE_CONFIG[component.type];
    const TypeIcon = config.icon;

    const getTypeColor = () => {
        return `${config.bgColor} ${config.color} ${config.borderColor}`;
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getTypeColor()}`}
                >
                    <TypeIcon className="h-4 w-4" />
                    {component.type}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onEdit}
                        size="sm"
                        className="bg-dashboard-text text-white hover:bg-dashboard-text/90"
                    >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        편집
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isEventComponent(component) && <ShowDetail component={component} />}
                {isMixsetComponent(component) && <MixsetDetail component={component} />}
                {isLinkComponent(component) && <LinkDetail component={component} />}
            </div>
        </div>
    );
}
