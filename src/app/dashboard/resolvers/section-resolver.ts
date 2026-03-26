import type { Section } from '@/types/domain';
import { formatSectionLabel, getAvailableSections } from '@/app/dashboard/utils/section-helpers';
import type { SubmenuResolver } from '@/components/ui/simple-dropdown';

export function createSectionResolver(
    sections: Section[],
    entryId: string,
    addEntryToSection: (sectionId: string, entryId: string) => void
): SubmenuResolver {
    return () => {
        if (sections.length === 0) {
            return [{ label: 'No sections yet', disabled: true, onClick: () => {} }];
        }

        const available = getAvailableSections(sections, entryId);

        if (available.length === 0) {
            return [{ label: 'On all sections', disabled: true, onClick: () => {} }];
        }

        return available.map((s) => ({
            label: formatSectionLabel(s),
            onClick: () => addEntryToSection(s.id, entryId),
        }));
    };
}
