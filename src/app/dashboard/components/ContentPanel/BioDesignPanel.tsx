'use client';

import { useState } from 'react';

import { ChevronDown, ChevronRight, MoreHorizontal, Pencil } from 'lucide-react';

import type { ProfileLink } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleDropdown, type DropdownMenuItemConfig } from '@/components/ui/simple-dropdown';

import { useUser } from '../../hooks';
import { usePageMeta } from '../../hooks/use-editor-data';
import { usePageMutations } from '../../hooks/use-page';
import {
    selectPageId,
    selectSetSettingsOpen,
    useDashboardStore,
} from '../../stores/dashboardStore';
import HeaderStyleSection from './HeaderStyleSection';
import LinksSection from './LinksSection';

export default function BioDesignPanel() {
    const user = useUser();
    const { data: pageMeta } = usePageMeta();
    const { updateHeaderStyle, updateLinks } = usePageMutations();
    const pageId = useDashboardStore(selectPageId);
    const setSettingsOpen = useDashboardStore(selectSetSettingsOpen);

    const [isProfileOpen, setIsProfileOpen] = useState(true);

    const handleLinksChange = (links: ProfileLink[]) => {
        if (pageId) {
            updateLinks.mutate({ pageId, links });
        }
    };

    const profileMenuItems: DropdownMenuItemConfig[] = [
        { label: 'Edit Profile', onClick: () => setSettingsOpen(true), icon: Pencil },
    ];

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-dashboard-border/50 px-6 py-5">
                <h2 className="text-lg font-medium text-dashboard-text">Bio Design</h2>
                <p className="text-sm text-dashboard-text-muted">
                    Configure your profile and page style
                </p>
            </div>

            {/* Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                    {/* Profile Section - Read Only */}
                    <section>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 text-left"
                            >
                                {isProfileOpen ? (
                                    <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                                )}
                                <h3 className="text-sm font-semibold text-dashboard-text">
                                    Profile
                                </h3>
                            </button>

                            <div className="ml-auto">
                                <SimpleDropdown
                                    trigger={
                                        <button
                                            type="button"
                                            className="rounded p-1 text-dashboard-text-muted hover:bg-dashboard-bg-hover hover:text-dashboard-text"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    }
                                    items={profileMenuItems}
                                    align="end"
                                />
                            </div>
                        </div>

                        {isProfileOpen && (
                            <div className="mt-4 rounded-xl border border-dashboard-border/50 bg-dashboard-bg-surface p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 shrink-0 border border-dashboard-border">
                                        <AvatarImage
                                            src={user.avatarUrl}
                                            alt={user.displayName}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-dashboard-bg-active text-xs font-medium text-dashboard-text-secondary">
                                            {getInitials(user.displayName || user.username)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-dashboard-text">
                                            {user.displayName || user.username}
                                        </p>
                                        <p className="truncate text-xs text-dashboard-text-muted">
                                            @{user.username}
                                            {user.region && (
                                                <>
                                                    <span className="text-dashboard-text-placeholder">
                                                        {' '}
                                                        ·{' '}
                                                    </span>
                                                    {user.region}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {user.bio && (
                                    <p className="mt-3 text-xs leading-relaxed text-dashboard-text-muted">
                                        {user.bio}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Links Section */}
                    <LinksSection links={pageMeta.pageSettings.links} onSave={handleLinksChange} />

                    {/* Header Style Section */}
                    <HeaderStyleSection
                        headerStyle={pageMeta.pageSettings.headerStyle}
                        onChangeHeaderStyle={(style) => {
                            if (pageId) {
                                updateHeaderStyle.mutate({ pageId, headerStyle: style });
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
