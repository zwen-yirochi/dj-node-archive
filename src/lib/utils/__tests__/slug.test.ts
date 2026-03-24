import { describe, expect, it } from 'vitest';

import { generateSlug } from '../slug';

describe('generateSlug', () => {
    it('converts spaces to hyphens and lowercases', () => {
        expect(generateSlug('Sunset Mix 2026')).toBe('sunset-mix-2026');
    });

    it('removes special characters', () => {
        expect(generateSlug('Hello! @World #2026')).toBe('hello-world-2026');
    });

    it('preserves unicode characters (Korean)', () => {
        expect(generateSlug('서울의 밤')).toBe('서울의-밤');
    });

    it('preserves unicode characters (Japanese)', () => {
        expect(generateSlug('東京の夜')).toBe('東京の夜');
    });

    it('collapses multiple hyphens', () => {
        expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
        expect(generateSlug('--hello--')).toBe('hello');
    });

    it('returns "untitled" for empty string', () => {
        expect(generateSlug('')).toBe('untitled');
    });

    it('returns "untitled" for whitespace-only', () => {
        expect(generateSlug('   ')).toBe('untitled');
    });

    it('returns "untitled" for special-chars-only', () => {
        expect(generateSlug('!@#$%')).toBe('untitled');
    });
});
