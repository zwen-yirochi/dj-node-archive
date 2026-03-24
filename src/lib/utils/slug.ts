/**
 * title 기반 slug 생성.
 * 유니코드 유지, 특수문자 제거, 공백 → -, lowercase.
 */
export function generateSlug(title: string): string {
    const slug = title
        .trim()
        .toLowerCase()
        // 유니코드 문자(한글, 일본어 등), 알파벳, 숫자, 공백, 하이픈 유지. 나머지 제거.
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        // 공백 → 하이픈
        .replace(/\s+/g, '-')
        // 연속 하이픈 → 단일 하이픈
        .replace(/-+/g, '-')
        // 앞뒤 하이픈 제거
        .replace(/^-|-$/g, '');

    return slug || 'untitled';
}
