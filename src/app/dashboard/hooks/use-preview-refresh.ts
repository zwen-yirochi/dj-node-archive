/**
 * 프리뷰 새로고침 콜백 시스템
 *
 * Zustand 상태(previewVersion) 대신 콜백 ref로 이벤트 전달.
 * - PreviewPanel이 useRegisterPreviewRefresh로 콜백 등록
 * - mutations의 onSuccess에서 triggerPreviewRefresh() 호출
 */

import { useEffect } from 'react';

const previewRefreshRef = { current: () => {} };

/** PreviewPanel에서 호출: iframe reload 콜백을 등록 */
export function useRegisterPreviewRefresh(callback: () => void) {
    useEffect(() => {
        previewRefreshRef.current = callback;
        return () => {
            previewRefreshRef.current = () => {};
        };
    }, [callback]);
}

/** mutation onSuccess에서 호출: 등록된 콜백 실행 */
export function triggerPreviewRefresh() {
    previewRefreshRef.current();
}
