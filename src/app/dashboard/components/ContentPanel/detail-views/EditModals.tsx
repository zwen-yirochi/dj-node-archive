'use client';

import { useState } from 'react';

import {
    DashboardDialogContent,
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/app/dashboard/components/ui/DashboardDialog';
import { Button } from '@/components/ui/button';

// ============================================
// TitleEditModal — Shared by Event + Mixset + Link
// ============================================

export function TitleEditModal({
    value,
    onSave,
    onClose,
}: {
    value: string;
    onSave: (title: string) => void;
    onClose: () => void;
}) {
    const [inputValue, setInputValue] = useState(value);

    const handleSave = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            onSave(trimmed);
            onClose();
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DashboardDialogContent>
                <DialogHeader>
                    <DialogTitle className="text-dashboard-text">Edit title</DialogTitle>
                    <DialogDescription className="text-dashboard-text-muted">
                        Enter a new title
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        placeholder="Title"
                        className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-text focus:border-dashboard-text focus:outline-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-dashboard-text-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!inputValue.trim()}
                            className="bg-dashboard-text text-dashboard-bg hover:bg-dashboard-text/90"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}
