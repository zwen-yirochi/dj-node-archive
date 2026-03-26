'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    ArtistImportPreview,
    ArtistImportResult,
    ArtistMigrationStatus,
    SingleEventImportResult,
} from '@/types/ra-import';

import { entryKeys } from './use-editor-data';

// ============================================
// Query Keys
// ============================================

export const raImportKeys = {
    migrationStatus: ['ra-import', 'migration-status'] as const,
};

// ============================================
// Migration Status
// ============================================

export function useMigrationStatus() {
    return useQuery<ArtistMigrationStatus>({
        queryKey: raImportKeys.migrationStatus,
        queryFn: async () => {
            const res = await fetch('/api/import/artist/status');
            if (!res.ok) throw new Error('Failed to fetch migration status');
            const json = await res.json();
            return json.data;
        },
        staleTime: 1000 * 60 * 5, // 5분간 캐시 — 마이그레이션 상태는 자주 변하지 않음
    });
}

// ============================================
// Artist Migration
// ============================================

export function useArtistPreview() {
    return useMutation<ArtistImportPreview, Error, { raUrl: string }>({
        mutationFn: async ({ raUrl }) => {
            const res = await fetch('/api/import/artist/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ra_url: raUrl }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Preview failed');
            return json.data;
        },
    });
}

export function useArtistConfirm() {
    const queryClient = useQueryClient();

    return useMutation<ArtistImportResult, Error, { raUrl: string; pageId: string }>({
        mutationFn: async ({ raUrl, pageId }) => {
            const res = await fetch('/api/import/artist/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ra_url: raUrl, page_id: pageId, consent: true }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Import failed');
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: raImportKeys.migrationStatus });
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}

// ============================================
// Single Event Import
// ============================================

export function useSingleEventImport() {
    const queryClient = useQueryClient();

    return useMutation<SingleEventImportResult, Error, { raUrl: string; pageId: string }>({
        mutationFn: async ({ raUrl, pageId }) => {
            const res = await fetch('/api/import/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ra_url: raUrl, page_id: pageId, consent: true }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Import failed');
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    });
}
