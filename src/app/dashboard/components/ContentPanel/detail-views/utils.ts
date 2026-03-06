/** URL → stable ID (short hash) for React key */
export function urlToStableId(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    return `img-${(hash >>> 0).toString(36)}`;
}
