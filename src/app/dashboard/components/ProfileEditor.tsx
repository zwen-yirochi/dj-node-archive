// app/dashboard/components/ProfileEditor.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEditorStore } from '@/stores/editorStore';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import { Camera, ChevronRight, Loader2, Save, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface ProfileEditorProps {
    compact?: boolean;
}

export default function ProfileEditor({ compact = false }: ProfileEditorProps) {
    const user = useEditorStore((state) => state.user);
    const updateUser = useEditorStore((state) => state.updateUser);

    const [isEditing, setIsEditing] = useState(false);
    const [tempUser, setTempUser] = useState<User | null>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleEdit = () => {
        setTempUser(user);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!tempUser) return;

        // 낙관적 업데이트
        updateUser(tempUser);
        setIsEditing(false);

        // DB 저장
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempUser),
            });

            if (!response.ok) {
                // 실패 시 롤백
                updateUser(user);
                console.error('프로필 업데이트 실패');
            }
        } catch (error) {
            // 실패 시 롤백
            updateUser(user);
            console.error('프로필 업데이트 오류:', error);
        }
    };

    const handleCancel = () => {
        setTempUser(user);
        setIsEditing(false);
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tempUser) return;

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        // 파일 타입 체크
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            alert('JPG, PNG, WebP, GIF 형식만 지원합니다.');
            return;
        }

        setIsUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // 기존 아바타 삭제 (같은 폴더 내 파일들)
            if (tempUser.avatarUrl?.includes('avatars')) {
                const oldPath = tempUser.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            // 새 파일 업로드
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 공개 URL 가져오기
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

            setTempUser({ ...tempUser, avatarUrl: urlData.publicUrl });
        } catch (error) {
            console.error('아바타 업로드 오류:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            // input 초기화
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteAvatar = async () => {
        if (!tempUser) return;

        setIsUploading(true);

        try {
            if (tempUser.avatarUrl?.includes('avatars')) {
                const supabase = createClient();
                const oldPath = tempUser.avatarUrl.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            setTempUser({ ...tempUser, avatarUrl: '' });
        } catch (error) {
            console.error('아바타 삭제 오류:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // 컴팩트 모드 (축소 UI)
    if (compact) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* 아바타 - 편집 모드에서 클릭 가능 */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={!isEditing || isUploading}
                            className={`group relative ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <Avatar className="h-12 w-12 border border-stone-300">
                                <AvatarImage
                                    src={isEditing ? tempUser?.avatarUrl : user.avatarUrl}
                                    alt={user.displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-stone-200 text-sm font-semibold text-stone-600">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>

                            {/* 편집 모드 오버레이 */}
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <Camera className="h-4 w-4 text-white" />
                                    )}
                                </div>
                            )}
                        </button>

                        {/* 삭제 버튼 */}
                        {isEditing && tempUser?.avatarUrl && (
                            <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                disabled={isUploading}
                                className="absolute -bottom-0.5 -right-0.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md transition-colors hover:bg-destructive/90"
                            >
                                <Trash2 className="h-2.5 w-2.5" />
                            </button>
                        )}

                        {/* 숨겨진 파일 입력 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* 이름/바이오 또는 편집 폼 */}
                    {!isEditing ? (
                        <div>
                            <h3 className="text-sm font-semibold text-stone-900">
                                {user.displayName}
                            </h3>
                            <p className="line-clamp-1 text-xs text-stone-500">
                                {user.bio || 'Capturing envy-worthy moments'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={tempUser?.displayName || ''}
                                onChange={(e) =>
                                    setTempUser(
                                        tempUser
                                            ? { ...tempUser, displayName: e.target.value }
                                            : null
                                    )
                                }
                                placeholder="Display Name"
                                className="h-8 w-32 text-sm"
                            />
                            <Input
                                type="text"
                                value={tempUser?.bio || ''}
                                onChange={(e) =>
                                    setTempUser(
                                        tempUser ? { ...tempUser, bio: e.target.value } : null
                                    )
                                }
                                placeholder="Bio"
                                className="h-8 w-48 text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* 버튼 */}
                {!isEditing ? (
                    <Button onClick={handleEdit} variant="ghost" size="sm" className="text-xs">
                        Edit
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isUploading}
                            size="sm"
                            className="h-7 text-xs"
                        >
                            <Save className="h-3 w-3" />
                            Save
                        </Button>
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // 기본 모드 (전체 UI)
    return (
        <section className="mb-12">
            <h2 className="m-2 text-2xl font-semibold text-primary">Profile</h2>

            <div className="overflow-hidden rounded-2xl border border-stone-400 shadow-sm">
                <div className="flex items-center justify-between p-8">
                    <div className="flex items-center gap-6">
                        {/* 아바타 - 편집 모드에서 클릭 가능 */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={!isEditing || isUploading}
                                className={`group relative ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <Avatar className="h-24 w-24 border-2 border-gray-500">
                                    <AvatarImage
                                        src={isEditing ? tempUser?.avatarUrl : user.avatarUrl}
                                        alt={user.displayName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-stone-200 text-2xl font-semibold text-stone-600">
                                        {getInitials(user.displayName)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* 편집 모드 오버레이 */}
                                {isEditing && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        {isUploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                )}
                            </button>

                            {/* 삭제 버튼 */}
                            {isEditing && tempUser?.avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleDeleteAvatar}
                                    disabled={isUploading}
                                    className="absolute -bottom-1 -right-1 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-colors hover:bg-destructive/90"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}

                            {/* 숨겨진 파일 입력 */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        <div>
                            <h3 className="mb-1 text-xl font-semibold text-stone-900">
                                {user.displayName}
                            </h3>
                            <p className="text-sm text-stone-500">
                                {user.bio || 'Capturing envy-worthy moments'}
                            </p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                            size="lg"
                            className="rounded-xl"
                        >
                            Edit profile
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                onClick={handleSave}
                                disabled={isUploading}
                                className="rounded-lg bg-gray-500 hover:bg-gray-600"
                            >
                                <Save className="h-4 w-4" />
                                Save changes
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                size="icon"
                                className="rounded-lg"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* 편집 폼 - 조건부 렌더링 */}
                {isEditing && tempUser && (
                    <div className="border-t border-stone-200 p-8 pt-6 animate-in slide-in-from-top-2">
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary">
                                    Display Name
                                </label>
                                <Input
                                    type="text"
                                    value={tempUser.displayName}
                                    onChange={(e) =>
                                        setTempUser({ ...tempUser, displayName: e.target.value })
                                    }
                                    className="h-11 rounded-lg border-stone-300 bg-white focus-visible:ring-stone-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary">
                                    Bio
                                </label>
                                <Textarea
                                    value={tempUser.bio || ''}
                                    onChange={(e) =>
                                        setTempUser({ ...tempUser, bio: e.target.value })
                                    }
                                    rows={3}
                                    placeholder="Capturing envy-worthy moments"
                                    className="resize-none rounded-lg border-stone-300 bg-white focus-visible:ring-stone-900"
                                />
                            </div>

                            {/* 아바타 업로드 안내 */}
                            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
                                <p className="text-sm text-stone-500">
                                    프로필 사진을 변경하려면 위의 아바타 이미지를 클릭하세요.
                                    <br />
                                    <span className="text-xs text-stone-400">
                                        지원 형식: JPG, PNG, WebP, GIF (최대 5MB)
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
