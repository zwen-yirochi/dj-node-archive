'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserStore } from '@/stores/userStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useTransition } from 'react';
import { deleteAvatar, updateProfile, uploadAvatar } from '../../actions/user';
import AvatarUpload from './AvatarUpload';
import HeaderStyleSection from './HeaderStyleSection';

export default function BioDesignPanel() {
    const user = useUserStore((state) => state.user);
    const updateUser = useUserStore((state) => state.updateUser);

    const [isProfileOpen, setIsProfileOpen] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Debounced save function
    const debouncedSave = useDebounce(
        async (userId: string, field: 'displayName' | 'bio', value: string) => {
            const result = await updateProfile(userId, { [field]: value });
            if (!result.success) {
                console.error('프로필 저장 오류:', result.error);
            }
        },
        500
    );

    if (!user) return null;

    const handleUploadAvatar = (formData: FormData) => {
        startTransition(async () => {
            const result = await uploadAvatar(user.id, formData);

            if (result.success) {
                if (result.data) {
                    updateUser({ avatarUrl: result.data.avatarUrl });
                }
            } else {
                alert(result.error);
            }
        });
    };

    const handleDeleteAvatar = () => {
        startTransition(async () => {
            const result = await deleteAvatar(user.id);

            if (result.success) {
                updateUser({ avatarUrl: '' });
            } else {
                console.error('아바타 삭제 오류:', result.error);
            }
        });
    };

    const handleProfileChange = (field: 'displayName' | 'bio', value: string) => {
        // Optimistic update
        updateUser({ [field]: value });
        // Debounced save
        debouncedSave(user.id, field, value);
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-dashboard-border px-6 py-4">
                <h2 className="text-lg font-semibold text-dashboard-text">Bio Design</h2>
                <p className="text-sm text-dashboard-text-muted">
                    프로필과 페이지 스타일을 설정합니다
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
                                프로필
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
                                        isPending={isPending}
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
                                            placeholder="이름"
                                            className="border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <Textarea
                                    value={user.bio || ''}
                                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                                    placeholder="소개"
                                    rows={3}
                                    className="resize-none border-dashboard-border bg-transparent text-dashboard-text placeholder:text-dashboard-text-placeholder"
                                />
                            </div>
                        )}
                    </section>

                    {/* Header Style Section */}
                    <HeaderStyleSection />
                </div>
            </div>
        </div>
    );
}
