import type { ComponentType } from 'react';

import type { ContentEntry, ResolvedSection, ViewType } from '@/types/domain';
import { SectionLabel } from '@/components/dna/SectionLabel';

import { CarouselView } from './section-views/CarouselView';
import { FeatureView } from './section-views/FeatureView';
import { ListView } from './section-views/ListView';

interface SectionViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;
}

const VIEW_RENDERERS: Record<ViewType, ComponentType<SectionViewProps>> = {
    carousel: CarouselView,
    list: ListView,
    feature: FeatureView,
};

interface Props {
    section: ResolvedSection;
    username: string;
}

export function SectionRenderer({ section, username }: Props) {
    const View = VIEW_RENDERERS[section.viewType];

    return (
        <section className="my-5">
            {section.title && (
                <SectionLabel right={`${section.entries.length} ITEMS`}>
                    {section.title}
                </SectionLabel>
            )}
            <View entries={section.entries} options={section.options} username={username} />
        </section>
    );
}
