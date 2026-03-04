'use client';

import { useState } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Button } from '@/components/ui/button';

import type { useConfirmAction } from '../../hooks/use-confirm-action';
import { DashboardDialogContent } from './DashboardDialog';

type ConfirmActionReturn = ReturnType<typeof useConfirmAction>;

interface ConfirmDialogProps {
    pending: ConfirmActionReturn['pending'];
    matchValue: ConfirmActionReturn['matchValue'];
    onConfirm: ConfirmActionReturn['confirm'];
    onClose: ConfirmActionReturn['close'];
}

export function ConfirmDialog({ pending, matchValue, onConfirm, onClose }: ConfirmDialogProps) {
    if (!pending) return null;

    const { strategy } = pending;

    return (
        <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
            <DashboardDialogContent size="sm">
                <div className="space-y-2">
                    <DialogPrimitive.Title className="text-base font-semibold text-dashboard-text">
                        {strategy.title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-sm text-dashboard-text-muted">
                        {strategy.description}
                    </DialogPrimitive.Description>
                </div>

                {strategy.type === 'type-to-confirm' ? (
                    <TypeToConfirmBody
                        matchValue={matchValue}
                        onConfirm={onConfirm}
                        onClose={onClose}
                    />
                ) : (
                    <SimpleConfirmBody onConfirm={onConfirm} onClose={onClose} />
                )}
            </DashboardDialogContent>
        </DialogPrimitive.Root>
    );
}

function SimpleConfirmBody({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-dashboard-text-muted hover:bg-dashboard-bg-hover"
            >
                Cancel
            </Button>
            <Button
                size="sm"
                onClick={onConfirm}
                className="bg-dashboard-danger-emphasis text-white hover:bg-dashboard-danger-emphasis-hover"
            >
                Delete
            </Button>
        </div>
    );
}

function TypeToConfirmBody({
    matchValue,
    onConfirm,
    onClose,
}: {
    matchValue: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const [inputValue, setInputValue] = useState('');
    const isMatch = inputValue === matchValue;

    return (
        <div className="space-y-3 pt-2">
            <div className="space-y-2">
                <p className="text-sm text-dashboard-text-secondary">
                    Type <span className="font-semibold text-dashboard-text">{matchValue}</span> to
                    confirm.
                </p>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-text outline-none transition-colors focus:border-dashboard-text-placeholder"
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-dashboard-text-muted hover:bg-dashboard-bg-hover"
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    disabled={!isMatch}
                    onClick={onConfirm}
                    className="bg-dashboard-danger-emphasis text-white hover:bg-dashboard-danger-emphasis-hover disabled:opacity-50"
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}
