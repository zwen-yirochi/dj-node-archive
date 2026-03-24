'use client';

import { useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { useArtistConfirm, useArtistPreview, useMigrationStatus } from '../../hooks/use-ra-import';
import { selectPageId, useDashboardStore } from '../../stores/dashboardStore';

const RA_ARTIST_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/dj\/[\w-]+/;

export default function SettingsRAImport() {
    const { data: migrationStatus, isLoading: statusLoading } = useMigrationStatus();

    if (statusLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-dashboard-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
            </div>
        );
    }

    if (migrationStatus?.completed) {
        return <MigrationCompleted status={migrationStatus} />;
    }

    return <MigrationForm />;
}

// ---------------------------------------------------------------------------
// Completed state
// ---------------------------------------------------------------------------

function MigrationCompleted({
    status,
}: {
    status: { artistName?: string; eventCount?: number; completedAt?: string };
}) {
    const date = status.completedAt ? new Date(status.completedAt).toLocaleDateString() : '';

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-medium text-dashboard-text">RA Artist Migration</h3>
                <span className="flex items-center gap-1 rounded-full bg-dashboard-success/10 px-2 py-0.5 text-[11px] text-dashboard-success">
                    <Check className="h-3 w-3" />
                    Done
                </span>
            </div>
            <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-4 text-sm text-dashboard-text-secondary">
                <p>Artist: {status.artistName ?? 'Unknown'}</p>
                <p>
                    Imported: {status.eventCount ?? 0} events{date ? ` | ${date}` : ''}
                </p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Migration form
// ---------------------------------------------------------------------------

function MigrationForm() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const pageId = useDashboardStore(selectPageId);

    const previewMutation = useArtistPreview();
    const confirmMutation = useArtistConfirm();

    const isValidUrl = RA_ARTIST_URL_REGEX.test(url);
    const preview = previewMutation.data;
    const result = confirmMutation.data;

    const handlePreview = () => {
        if (!isValidUrl) return;
        setError('');
        previewMutation.mutate({ raUrl: url }, { onError: (err) => setError(err.message) });
    };

    const handleConfirm = () => {
        if (!pageId) return;
        setError('');
        confirmMutation.mutate({ raUrl: url, pageId }, { onError: (err) => setError(err.message) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-[13px] font-medium text-dashboard-text">RA Artist Migration</h3>
                <p className="mt-1 text-xs text-dashboard-text-muted">
                    Import your full event history from your RA profile.
                </p>
            </div>

            {/* URL Input */}
            {!result && (
                <div className="space-y-3">
                    <Input
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setError('');
                            previewMutation.reset();
                        }}
                        placeholder="https://ra.co/dj/..."
                        disabled={confirmMutation.isPending}
                        className="border-dashboard-border bg-dashboard-bg-card text-sm text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
                    />

                    {error && <p className="text-xs text-dashboard-danger">{error}</p>}

                    {!preview && (
                        <button
                            onClick={handlePreview}
                            disabled={!isValidUrl || previewMutation.isPending}
                            className="flex items-center gap-2 rounded-md bg-dashboard-bg-active px-3 py-1.5 text-sm text-dashboard-text transition-colors hover:bg-dashboard-bg-hover disabled:opacity-50"
                        >
                            {previewMutation.isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Preview
                        </button>
                    )}
                </div>
            )}

            {/* Preview */}
            {preview && !result && (
                <div className="space-y-4">
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-4 text-sm">
                        <p className="text-dashboard-text">Artist: {preview.artist.name}</p>
                        <p className="text-dashboard-text-secondary">
                            Events: {preview.artist.eventCount}
                        </p>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={confirmMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-dashboard-text px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-dashboard-text/90 disabled:opacity-50"
                    >
                        {confirmMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            'Import All'
                        )}
                    </button>
                </div>
            )}

            {/* Result Report */}
            {result && (
                <div className="space-y-3">
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-4 text-sm">
                        <p className="text-dashboard-success">Success: {result.successCount}</p>
                        {result.failedCount > 0 && (
                            <>
                                <p className="mt-1 text-dashboard-danger">
                                    Failed: {result.failedCount}
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-dashboard-text-muted">
                                    {result.failedEvents.map((f, i) => (
                                        <li key={i}>
                                            - {f.title}: {f.reason}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
