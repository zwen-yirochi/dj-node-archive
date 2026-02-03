import { LINK_ICON_COMPONENTS } from '@/constants/componentConfig';
import type { LinkComponent } from '@/types';
import { ExternalLink, Globe } from 'lucide-react';

interface LinkDetailProps {
    component: LinkComponent;
}

export default function LinkDetail({ component }: LinkDetailProps) {
    const IconComponent = LINK_ICON_COMPONENTS[component.icon] || Globe;

    return (
        <div className="space-y-4 py-4 text-center">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted">
                <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-dashboard-text">
                {component.title || '제목 없음'}
            </h2>

            {/* URL */}
            <a
                href={component.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text-secondary"
            >
                <ExternalLink className="h-3.5 w-3.5" />
                {component.url}
            </a>
        </div>
    );
}
