/** 이벤트 날짜 → "2025.01.15 // WED" */
export function formatEventDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        return `${yyyy}.${mm}.${dd} // ${day}`;
    } catch {
        return dateStr;
    }
}

/** 엔트리 날짜 → "15 JAN 25" (GB 포맷, EntryCard용) */
export function formatDateCompact(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            })
            .toUpperCase();
    } catch {
        return dateStr;
    }
}

/** 베뉴 ID → "VN-A1B2" */
export function venueCode(id?: string | null): string {
    if (!id) return 'VN-0000';
    return `VN-${id.slice(0, 4).toUpperCase()}`;
}
