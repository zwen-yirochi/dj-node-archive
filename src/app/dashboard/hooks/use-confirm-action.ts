'use client';

import { useCallback, useState } from 'react';

import type { ConfirmStrategy, MenuConfig } from '../config/menuConfig';

// ============================================
// Types
// ============================================

interface PendingConfirm {
    strategy: ConfirmStrategy;
    onConfirm: () => void;
}

interface UseConfirmActionReturn {
    /** confirm 전략이 있는 actionKey의 handler를 래핑 */
    wrapHandlers: (
        menuConfig: MenuConfig,
        handlers: Record<string, () => void>,
        entry?: Record<string, unknown>
    ) => Record<string, () => void>;
    /** 현재 열린 confirm 상태 (null이면 닫힘) */
    pending: PendingConfirm | null;
    /** confirm 모달 닫기 */
    close: () => void;
    /** confirm 실행 (모달에서 확인 버튼) */
    confirm: () => void;
    /** type-to-confirm용: 매칭할 값 */
    matchValue: string;
}

// ============================================
// Hook
// ============================================

export function useConfirmAction(): UseConfirmActionReturn {
    const [pending, setPending] = useState<PendingConfirm | null>(null);
    const [matchValue, setMatchValue] = useState('');

    const close = useCallback(() => {
        setPending(null);
        setMatchValue('');
    }, []);

    const confirm = useCallback(() => {
        pending?.onConfirm();
        close();
    }, [pending, close]);

    const wrapHandlers = useCallback(
        (
            menuConfig: MenuConfig,
            handlers: Record<string, () => void>,
            entry?: Record<string, unknown>
        ): Record<string, () => void> => {
            const wrapped = { ...handlers };

            for (const item of menuConfig) {
                if ('type' in item || !item.confirm) continue;
                const originalHandler = handlers[item.actionKey];
                if (!originalHandler) continue;

                // confirm이 함수면 entry 컨텍스트로 전략 resolve
                const strategy =
                    typeof item.confirm === 'function' ? item.confirm(entry ?? {}) : item.confirm;

                // 전략이 undefined면 즉시 실행 (조건부 confirm)
                if (!strategy) continue;

                // type-to-confirm: matchField에서 실제 값을 resolve
                if (strategy.type === 'type-to-confirm' && entry) {
                    const resolvedValue = String(entry[strategy.matchField] ?? '');
                    wrapped[item.actionKey] = () => {
                        setMatchValue(resolvedValue);
                        setPending({ strategy, onConfirm: originalHandler });
                    };
                } else {
                    wrapped[item.actionKey] = () => {
                        setPending({ strategy, onConfirm: originalHandler });
                    };
                }
            }

            return wrapped;
        },
        []
    );

    return { wrapHandlers, pending, close, confirm, matchValue };
}
