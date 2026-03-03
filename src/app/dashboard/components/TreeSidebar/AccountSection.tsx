'use client';

import { ChevronUp, ExternalLink, LogOut, Settings } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import { useUser } from '../../hooks';
import { selectSetSettingsOpen, useDashboardStore } from '../../stores/dashboardStore';

interface AccountSectionProps {
    username: string;
}

export default function AccountSection({ username }: AccountSectionProps) {
    const user = useUser();
    const setSettingsOpen = useDashboardStore(selectSetSettingsOpen);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const accountMenuItems: DropdownMenuItemConfig[] = [
        { label: 'Settings', onClick: () => setSettingsOpen(true), icon: Settings },
        { label: 'View my page', href: `/${username}`, icon: ExternalLink, external: true },
        { type: 'separator' },
        { label: 'Sign out', onClick: handleLogout, icon: LogOut, variant: 'danger' },
    ];

    return (
        <>
            <div className="mt-auto border-t border-dashboard-border">
                <SimpleDropdown
                    trigger={
                        <button className="flex w-full cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-dashboard-bg-hover">
                            <Avatar className="h-8 w-8 border border-dashboard-border">
                                <AvatarImage
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-dashboard-bg-active text-xs font-medium text-dashboard-text-secondary">
                                    {getInitials(user.displayName || username)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 text-left">
                                <p className="truncate text-sm font-medium text-dashboard-text">
                                    {user.displayName || username}
                                </p>
                                <p className="truncate text-xs text-dashboard-text-muted">
                                    @{username}
                                </p>
                            </div>

                            <ChevronUp className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
                        </button>
                    }
                    items={accountMenuItems}
                    align="start"
                    side="top"
                    contentClassName="w-56"
                />
            </div>
        </>
    );
}
