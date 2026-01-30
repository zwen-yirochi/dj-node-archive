// app/dashboard/components/ProfileEditor.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEditorStore } from '@/stores/editorStore';
import type { User } from '@/types';
import { ChevronRight, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function ProfileEditor() {
    const user = useEditorStore((state) => state.user);
    const updateUser = useEditorStore((state) => state.updateUser);

    const [isEditing, setIsEditing] = useState(false);
    const [tempUser, setTempUser] = useState<User | null>(user);

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

    return (
        <section className="mb-12">
            <h2 className="m-2 text-2xl font-semibold text-primary">Profile</h2>

            <div className="overflow-hidden rounded-2xl border border-stone-400 shadow-sm">
                <div className="flex items-center justify-between p-8">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-2 border-gray-500">
                            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                            <AvatarFallback className="bg-stone-200 text-2xl font-semibold text-stone-600">
                                {getInitials(user.displayName)}
                            </AvatarFallback>
                        </Avatar>

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

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary">
                                    Avatar URL
                                </label>
                                <Input
                                    type="url"
                                    value={tempUser.avatarUrl || ''}
                                    onChange={(e) =>
                                        setTempUser({ ...tempUser, avatarUrl: e.target.value })
                                    }
                                    placeholder="https://example.com/avatar.jpg"
                                    className="h-11 rounded-lg border-stone-300 bg-white focus-visible:ring-stone-900"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
