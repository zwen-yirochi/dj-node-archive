import type { ContentEntry, Section } from '@/types/domain';

/** Check if an entry can be added to a given section */
export function canAddToSection(section: Section, entryId: string): boolean {
    if (section.entryIds.includes(entryId)) return false;
    if (section.viewType === 'feature' && section.entryIds.length >= 1) return false;
    return true;
}

/** Filter entries that can be added to a given section */
export function getAddableEntries(section: Section, allEntries: ContentEntry[]): ContentEntry[] {
    return allEntries.filter((e) => canAddToSection(section, e.id));
}

/** Filter sections that a given entry can be added to */
export function getAvailableSections(sections: Section[], entryId: string): Section[] {
    return sections.filter((s) => canAddToSection(s, entryId));
}

/** Format a section's display label */
export function formatSectionLabel(section: Section): string {
    return (
        section.title ||
        `${section.viewType.charAt(0).toUpperCase() + section.viewType.slice(1)} section`
    );
}
