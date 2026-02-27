'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import type { EditorData } from '@/lib/services/user.service';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useUser, useUserMutations } from '../../hooks';
import { entryKeys } from '../../hooks/use-editor-data';
import { useQueryClient } from '@tanstack/react-query';
import AvatarUpload from './AvatarUpload';
import HeaderStyleSection from './HeaderStyleSection';

export default function BioDesignPanel() {
    const user = useUser();
    const { updateProfile, uploadAvatar, deleteAvatar } = useUserMutations();
    const queryClient = useQueryClient();

    const [isProfileOpen, setIsProfileOpen] = useState(true);

    // Debounced save — 타이핑 중 서버 동기화
    const debouncedSave = useDebounce((updates: { displayName?: string; bio?: string }) => {
        updateProfile.mutate({ userId: user.id, updates });
    }, 500);

    const handleUploadAvatar = (formData: FormData) => {
        uploadAvatar.mutate(
            { userId: user.id, formData },
            {
                onError: () => alert('이미지 업로드에 실패했습니다.'),
            }
        );
    };

    const handleDeleteAvatar = () => {
        deleteAvatar.mutate(
            { userId: user.id },
            {
                onError: () => console.error('아바타 삭제 오류'),
            }
        );
    };

    const handleProfileChange = (field: 'displayName' | 'bio', value: string) => {
        // 즉시 TQ 캐시 업데이트 (타이핑 반영)
        queryClient.setQueryData<EditorData>(entryKeys.all, (prev) =>
            prev ? { ...prev, user: { ...prev.user, [field]: value } } : prev
        );
        // 디바운스 서버 동기화
        debouncedSave({ [field]: value });
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
