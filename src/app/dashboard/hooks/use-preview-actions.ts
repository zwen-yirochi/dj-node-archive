/**
 * Preview action system
 *
 * Action types:
 * - refresh: reload current iframe URL (used by mutation onSuccess)
 *   - target: which preview context this refresh is for
 *     'userpage' → only refreshes when previewing /{username}
 *     'entry-detail' → only refreshes when previewing /{username}/{entryId}
 * - navigate: change iframe src to a new URL (used by contentView changes)
 *
 * PreviewPanel registers a handler via useRegisterPreviewHandler.
 * The handler checks the current contentView against the refresh target.
 */

import { useEffect } from 'react';

export type PreviewTarget = 'userpage' | 'entry-detail';

export type PreviewAction =
    | { type: 'refresh'; target: PreviewTarget }
    | { type: 'navigate'; url: string };

type PreviewHandler = (action: PreviewAction) => void;

const handlerRef = { current: null as PreviewHandler | null };

/** Called from PreviewPanel: registers the action handler */
export function useRegisterPreviewHandler(handler: PreviewHandler) {
    useEffect(() => {
        handlerRef.current = handler;
        return () => {
            handlerRef.current = null;
        };
    }, [handler]);
}

function dispatchPreviewAction(action: PreviewAction) {
    handlerRef.current?.(action);
}

/** Called from mutation onSuccess: reloads the iframe if target matches current view */
export function triggerPreviewRefresh(target: PreviewTarget = 'userpage') {
    dispatchPreviewAction({ type: 'refresh', target });
}

/** Called to navigate the preview iframe to a new URL */
export function navigatePreview(url: string) {
    dispatchPreviewAction({ type: 'navigate', url });
}
