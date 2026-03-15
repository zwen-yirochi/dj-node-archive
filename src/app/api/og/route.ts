import {
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/api/responses';
import { withAuth } from '@/lib/api/withAuth';

/**
 * GET /api/og?url=...
 * URL에서 OG 메타데이터 (title, description, image)를 추출
 */
export const GET = withAuth(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return validationErrorResponse('url is required');

    try {
        new URL(url);
    } catch {
        return validationErrorResponse('Invalid URL');
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DNABot/1.0)',
                Accept: 'text/html',
            },
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return successResponse({ title: null, description: null, imageUrl: null });
        }

        // Only read first 50KB to avoid downloading huge pages
        const reader = res.body?.getReader();
        if (!reader) {
            return successResponse({ title: null, description: null, imageUrl: null });
        }

        let html = '';
        const decoder = new TextDecoder();
        let bytesRead = 0;
        const MAX_BYTES = 50_000;

        while (bytesRead < MAX_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
            bytesRead += value.length;
        }
        reader.cancel();

        const title = extractMeta(html, 'og:title') ?? extractTag(html, 'title');
        const description = extractMeta(html, 'og:description') ?? extractMeta(html, 'description');
        const imageUrl = extractMeta(html, 'og:image');

        // Resolve relative image URLs
        const resolvedImageUrl = imageUrl ? resolveUrl(imageUrl, url) : null;

        return successResponse({
            title: title?.trim() ?? null,
            description: description?.trim() ?? null,
            imageUrl: resolvedImageUrl,
        });
    } catch {
        return internalErrorResponse('Failed to fetch URL metadata');
    }
});

function extractMeta(html: string, property: string): string | null {
    // Match both property="og:..." and name="description" patterns
    const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']|` +
            `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
        'i'
    );
    const match = html.match(regex);
    return match?.[1] ?? match?.[2] ?? null;
}

function extractTag(html: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
    return html.match(regex)?.[1] ?? null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveUrl(imageUrl: string, baseUrl: string): string {
    try {
        return new URL(imageUrl, baseUrl).href;
    } catch {
        return imageUrl;
    }
}
