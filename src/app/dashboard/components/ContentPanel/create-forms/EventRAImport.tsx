'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { useSingleEventImport } from '../../../hooks/use-ra-import';
import { selectPageId, selectSetView, useDashboardStore } from '../../../stores/dashboardStore';

const RA_EVENT_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/events\/\d+/;

export default function EventRAImport() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const importMutation = useSingleEventImport();

    const isValidUrl = RA_EVENT_URL_REGEX.test(url);

    const handleImport = () => {
        if (!isValidUrl || !pageId) return;
        setError('');

        importMutation.mutate(
            { raUrl: url, pageId },
            {
                onSuccess: (data) => {
                    setView({ kind: 'detail', entryId: data.entry.id }, { replace: true });
                },
                onError: (err) => {
                    setError(err.message);
                },
            }
        );
    };

    return (
        <div className="space-y-3">
            <Input
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                }}
                placeholder="https://ra.co/events/..."
                className="border-dashboard-border bg-dashboard-bg-card text-sm text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
            />

            {error && <p className="text-xs text-dashboard-danger">{error}</p>}

            <button
                onClick={handleImport}
                disabled={!isValidUrl || importMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-dashboard-text px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-dashboard-text/90 disabled:opacity-50"
            >
                {importMutation.isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching event from RA...
                    </>
                ) : (
                    'Import'
                )}
            </button>
        </div>
    );
}
