'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { ProfileLink, User } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useUser, useUserMutations } from '../../hooks';
import { usePageMeta, userKeys } from '../../hooks/use-editor-data';
import { usePageMutations } from '../../hooks/use-page';
import { selectPageId, useDashboardStore } from '../../stores/dashboardStore';
import AvatarUpload from './AvatarUpload';
import HeaderStyleSection from './HeaderStyleSection';
import LinksSection from './LinksSection';

export default function BioDesignPanel() {
    const user = useUser();
    const { updateProfile, uploadAvatar, deleteAvatar } = useUserMutations();
    const { data: pageMeta } = usePageMeta();
    const { updateHeaderStyle, updateLinks } = usePageMutations();
    const pageId = useDashboardStore(selectPageId);
    const queryClient = useQueryClient();

    const [isProfileOpen, setIsProfileOpen] = useState(true);

    // Debounced save — sync to server while typing
    const debouncedSave = useDebounce((updates: { displayName?: string; bio?: string }) => {
        updateProfile.mutate({ userId: user.id, updates });
    }, 500);

    const handleUploadAvatar = (formData: FormData) => {
        uploadAvatar.mutate(
            { userId: user.id, formData },
            {
                onError: () => alert('Image upload failed.'),
            }
        );
    };

    const handleDeleteAvatar = () => {
        deleteAvatar.mutate(
            { userId: user.id },
            {
                onError: () => console.error('Avatar delete error'),
            }
        );
    };

    const handleProfileChange = (field: 'displayName' | 'bio', value: string) => {
        // Immediately update TQ cache (reflect typing)
        queryClient.setQueryData<User>(userKeys.all, (prev) =>
            prev ? { ...prev, [field]: value } : prev
        );
        // Debounced server sync
        debouncedSave({ [field]: value });
    };

    const handleLinksChange = (links: ProfileLink[]) => {
        if (pageId) {
            updateLinks.mutate({ pageId, links });
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-dashboard-border px-6 py-4">
                <h2 className="text-lg font-semibold text-dashboard-text">Bio Design</h2>
                <p className="text-sm text-dashboard-text-muted">
                    Configure your profile and page style
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Profile Section - Collapsible */}
                    <section>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex w-full items-center gap-2 text-left"
                        >
                            {isProfileOpen ? (
                                <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                            )}
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                                Profile
                            </h3>
                        </button>

                        {isProfileOpen && (
                            <div className="mt-4 space-y-4">
                                {/* Avatar + Name Row */}
                                <div className="flex items-center gap-4">
                                    <AvatarUpload
                                        avatarUrl={user.avatarUrl}
                                        displayName={user.displayName}
                                        username={user.username}
                                        isPending={uploadAvatar.isPending || deleteAvatar.isPending}
                                        onUpload={handleUploadAvatar}
                                        onDelete={handleDeleteAvatar}
                                    />

                                    {/* Name Input */}
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={user.displayName || ''}
                                            onChange={(e) =>
                                                handleProfileChange('displayName', e.target.value)
                                            }
                                            placeholder="Name"
                                            className="border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <Textarea
                                    value={user.bio || ''}
                                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                                    placeholder="Bio"
                                    rows={3}
                                    className="resize-none border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                />
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
