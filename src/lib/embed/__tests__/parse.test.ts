import { describe, expect, it } from 'vitest';

import { parseEmbedUrl } from '../parse';

describe('parseEmbedUrl', () => {
    describe('YouTube', () => {
        it('parses youtube.com/watch?v=ID', () => {
            const result = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('parses youtu.be/ID', () => {
            const result = parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('parses youtube.com/embed/ID', () => {
            const result = parseEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('handles extra query params', () => {
            const result = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30');
            expect(result?.provider).toBe('youtube');
            expect(result?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
        });
    });

    describe('SoundCloud', () => {
        it('parses soundcloud.com/user/track', () => {
            const result = parseEmbedUrl('https://soundcloud.com/artist-name/track-name');
            expect(result).not.toBeNull();
            expect(result?.provider).toBe('soundcloud');
            expect(result?.displayName).toBe('SoundCloud');
            expect(result?.embedUrl).toContain('w.soundcloud.com/player');
            expect(result?.embedUrl).toContain('soundcloud.com/artist-name/track-name');
            expect(result?.dimensions).toEqual({ height: 166 });
        });
    });

    describe('unsupported URLs', () => {
        it('returns null for unsupported URL', () => {
            expect(parseEmbedUrl('https://example.com')).toBeNull();
        });

        it('returns null for empty string', () => {
            expect(parseEmbedUrl('')).toBeNull();
        });

        it('returns null for non-URL text', () => {
            expect(parseEmbedUrl('not a url')).toBeNull();
        });
    });
});
