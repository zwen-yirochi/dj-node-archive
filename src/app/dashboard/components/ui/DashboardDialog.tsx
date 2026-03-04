'use client';

import * as React from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Re-export unchanged primitives
export { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DashboardDialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className
        )}
        {...props}
    />
));
DashboardDialogOverlay.displayName = 'DashboardDialogOverlay';

const sizeVariants = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
} as const;

interface DashboardDialogContentProps extends React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Content
> {
    size?: keyof typeof sizeVariants;
}

const DashboardDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    DashboardDialogContentProps
>(({ className, children, size = 'md', ...props }, ref) => (
    <DialogPortal>
        <DashboardDialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl bg-white p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
                sizeVariants[size],
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-dashboard-text-placeholder transition-colors hover:text-dashboard-text focus:outline-none focus:ring-2 focus:ring-dashboard-border focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DashboardDialogContent.displayName = 'DashboardDialogContent';

// ============================================
// DashboardConfirmDialog
// ============================================

interface DashboardConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

function DashboardConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = '확인',
    cancelText = '취소',
    destructive = false,
}: DashboardConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DashboardDialogContent size="sm">
                <div className="space-y-2">
                    <DialogPrimitive.Title className="text-base font-semibold text-dashboard-text">
                        {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-sm text-dashboard-text-muted">
                        {description}
                    </DialogPrimitive.Description>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-dashboard-text-muted hover:bg-dashboard-bg-hover"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={
                            destructive
                                ? 'bg-dashboard-danger-emphasis text-white hover:bg-dashboard-danger-emphasis-hover'
                                : 'bg-dashboard-text text-white hover:bg-dashboard-text/90'
                        }
                    >
                        {confirmText}
                    </Button>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}

export {
    Dialog,
    DialogPortal,
    DialogTrigger,
    DialogClose,
    DashboardDialogContent,
    DashboardConfirmDialog,
};
