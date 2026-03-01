/**
 * Preview refresh callback system
 *
 * Uses callback ref instead of Zustand state (previewVersion) for event dispatch.
 * - PreviewPanel registers a callback via useRegisterPreviewRefresh
 * - triggerPreviewRefresh() is called from mutations' onSuccess
 */

import { useEffect } from 'react';

const previewRefreshRef = { current: () => {} };

/** Called from PreviewPanel: registers the iframe reload callback */
export function useRegisterPreviewRefresh(callback: () => void) {
    useEffect(() => {
        previewRefreshRef.current = callback;
        return () => {
            previewRefreshRef.current = () => {};
        };
    }, [callback]);
}

/** Called from mutation onSuccess: executes the registered callback */
export function triggerPreviewRefresh() {
    previewRefreshRef.current();
}
