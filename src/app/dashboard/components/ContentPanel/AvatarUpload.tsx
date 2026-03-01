'use client';

import { useRef } from 'react';

import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AvatarUploadProps {
    avatarUrl: string;
    displayName: string;
    username: string;
    isPending: boolean;
    onUpload: (formData: FormData) => void;
    onDelete: () => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function AvatarUpload({
    avatarUrl,
    displayName,
    username,
    isPending,
    onUpload,
    onDelete,
}: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        onUpload(formData);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button disabled={isPending} className="group relative shrink-0">
                        <Avatar className="h-16 w-16 border-2 border-dashboard-border">
                            <AvatarImage
                                src={avatarUrl}
                                alt={displayName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-dashboard-bg-active text-lg font-medium text-dashboard-text-secondary">
                                {getInitials(displayName || username)}
                            </AvatarFallback>
                        </Avatar>
                        {isPending && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-dashboard-text/50">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="w-40 border-dashboard-border bg-dashboard-bg-card"
                >
                    <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-dashboard-text-secondary focus:bg-dashboard-bg-muted focus:text-dashboard-text"
                    >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Upload image
                    </DropdownMenuItem>
                    {avatarUrl && (
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
            />
        </>
    );
}
