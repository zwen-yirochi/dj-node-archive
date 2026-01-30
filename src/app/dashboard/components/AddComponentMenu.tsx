// app/dashboard/components/AddComponentMenu.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Link, Music } from 'lucide-react';

interface AddComponentMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onAddComponent: (type: 'show' | 'mixset' | 'link') => void;
}

export function AddComponentMenu({ isOpen, onClose, onAddComponent }: AddComponentMenuProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-96 rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-lg font-semibold">Add Component</h3>
                <div className="space-y-2">
                    <Button
                        onClick={() => {
                            onAddComponent('show');
                        }}
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Show / Event
                    </Button>
                    <Button
                        onClick={() => {
                            onAddComponent('mixset');
                        }}
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Music className="mr-2 h-4 w-4" />
                        Mixset
                    </Button>
                    <Button
                        onClick={() => {
                            onAddComponent('link');
                        }}
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Link className="mr-2 h-4 w-4" />
                        Link
                    </Button>
                </div>
            </div>
        </div>
    );
}
