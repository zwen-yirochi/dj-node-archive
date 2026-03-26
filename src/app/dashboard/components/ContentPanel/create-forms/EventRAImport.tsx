'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { RA_EVENT_URL_REGEX } from '@/lib/validations/import.schemas';
import { Input } from '@/components/ui/input';

import { useSingleEventImport } from '../../../hooks/use-ra-import';
import { selectPageId, selectSetView, useDashboardStore } from '../../../stores/dashboardStore';

export default function EventRAImport() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const importMutation = useSingleEventImport();

    const isValidUrl = RA_EVENT_URL_REGEX.test(url);

    const handleImport = () => {
        if (!isValidUrl || !pageId || !agreed) return;
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

            <label className="flex items-start gap-2 text-xs text-dashboard-text-muted">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-dashboard-border"
                />
                <span>
                    I confirm that I have the right to use the imported content, including images,
                    for my personal archive.
                </span>
            </label>

            <button
                onClick={handleImport}
                disabled={!isValidUrl || !agreed || importMutation.isPending}
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
