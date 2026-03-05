'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Camera, Check, Loader2, LogOut, Trash2, User as UserIcon, X } from 'lucide-react';

import type { User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useUser, useUserMutations } from '../hooks';
import { checkUsernameAvailable } from '../hooks/use-user';
import { DashboardDialogContent, Dialog, DialogHeader, DialogTitle } from './ui/DashboardDialog';

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

// ---------------------------------------------------------------------------
// Settings section config
// ---------------------------------------------------------------------------

type SettingsSection = 'profile' | 'account';

const SETTINGS_SECTIONS: { key: SettingsSection; label: string; icon: typeof UserIcon }[] = [
    { key: 'profile', label: 'Profile', icon: UserIcon },
    { key: 'account', label: 'Account', icon: LogOut },
];

// ---------------------------------------------------------------------------
// SettingsModal
// ---------------------------------------------------------------------------

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DashboardDialogContent size="xl" className="gap-0 p-0 font-inter">
                <DialogHeader className="border-b border-dashboard-border/50 px-6 py-3.5">
                    <DialogTitle className="text-sm font-normal text-dashboard-text-secondary">
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="flex h-[720px]">
                    {/* Left nav */}
                    <nav className="w-40 shrink-0 border-r border-dashboard-border/50 p-3">
                        {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                                    activeSection === key
                                        ? 'bg-dashboard-bg-active text-dashboard-text'
                                        : 'text-dashboard-text-muted hover:bg-dashboard-bg-hover hover:text-dashboard-text-secondary'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Right content */}
                    <div className="flex-1 overflow-y-auto bg-dashboard-bg-surface/50 p-6">
                        {activeSection === 'profile' && (
                            <ProfileSection onClose={() => onOpenChange(false)} />
                        )}
                        {activeSection === 'account' && <AccountSettingsSection />}
                    </div>
                </div>
            </DashboardDialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Profile Section
// ---------------------------------------------------------------------------

function ProfileSection({ onClose }: { onClose: () => void }) {
    const user = useUser();
    const { updateProfile, uploadAvatar, deleteAvatar, updateUsername } = useUserMutations();

    const [tempUser, setTempUser] = useState<User>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Username editing state
    const [tempUsername, setTempUsername] = useState(user.username);
    const [usernameStatus, setUsernameStatus] = useState<
        'idle' | 'checking' | 'available' | 'taken' | 'invalid'
    >('idle');
    const usernameTimerRef = useRef<NodeJS.Timeout | null>(null);

    const checkUsername = useCallback(
        (value: string) => {
            if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

            if (value === user.username) {
                setUsernameStatus('idle');
                return;
            }
            if (!USERNAME_REGEX.test(value)) {
                setUsernameStatus('invalid');
                return;
            }

            setUsernameStatus('checking');
            usernameTimerRef.current = setTimeout(async () => {
                try {
                    const result = await checkUsernameAvailable(value, user.id);
                    setUsernameStatus(result.available ? 'available' : 'taken');
                } catch {
                    setUsernameStatus('idle');
                }
            }, 500);
        },
        [user.username, user.id]
    );

    useEffect(() => {
        return () => {
            if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
        };
    }, []);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const handleConfirmUsername = () => {
        if (tempUsername === user.username || usernameStatus !== 'available') return;
        updateUsername.mutate(
            { userId: user.id, username: tempUsername },
            {
                onError: (err) => toast({ variant: 'destructive', title: err.message }),
            }
        );
    };

    const handleSave = () => {
        updateProfile.mutate(
            {
                userId: user.id,
                updates: {
                    displayName: tempUser.displayName,
                    bio: tempUser.bio,
                    region: tempUser.region,
                },
            },
            {
                onError: () => toast({ variant: 'destructive', title: 'Profile update failed.' }),
            }
        );
        onClose();
    };

    const canSave = !isUploading;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'File must be under 5MB.' });
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Only JPG, PNG, WebP, GIF are supported.' });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        uploadAvatar.mutate(
            { userId: user.id, formData },
            {
                onSuccess: (data) => {
                    setTempUser((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
                },
                onError: () => toast({ variant: 'destructive', title: 'Image upload failed.' }),
                onSettled: () => {
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
            }
        );
    };

    const handleDeleteAvatar = () => {
        setIsUploading(true);

        deleteAvatar.mutate(
            { userId: user.id },
            {
                onSuccess: () => {
                    setTempUser((prev) => ({ ...prev, avatarUrl: '' }));
                },
                onError: () => toast({ variant: 'destructive', title: 'Avatar delete failed.' }),
                onSettled: () => setIsUploading(false),
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="group relative"
                >
                    <Avatar className="h-16 w-16 border border-dashboard-border">
                        <AvatarImage
                            src={tempUser.avatarUrl}
                            alt={tempUser.displayName}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-dashboard-bg-active text-lg font-medium text-dashboard-text-secondary">
                            {getInitials(tempUser.displayName || user.username)}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-full bg-dashboard-text/50 transition-opacity',
                            isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                            <Camera className="h-5 w-5 text-white" />
                        )}
                    </div>
                </button>
                {tempUser.avatarUrl && (
                    <button
                        onClick={handleDeleteAvatar}
                        disabled={isUploading}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-dashboard-danger transition-colors hover:bg-dashboard-danger-bg disabled:opacity-50"
                    >
                        <Trash2 className="h-3 w-3" />
                        Remove
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Username */}
            <div className="space-y-2">
                <label className="text-xs text-dashboard-text-muted">Username</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-dashboard-text-placeholder">
                        @
                    </span>
                    <Input
                        value={tempUsername}
                        onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            setTempUsername(val);
                            checkUsername(val);
                        }}
                        placeholder="username"
                        className="border-dashboard-border bg-dashboard-bg-card pl-7 pr-9 text-sm text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
                    />
                    {usernameStatus !== 'idle' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {usernameStatus === 'checking' && (
                                <Loader2 className="h-4 w-4 animate-spin text-dashboard-text-muted" />
                            )}
                            {usernameStatus === 'available' && (
                                <Check className="h-4 w-4 text-dashboard-success" />
                            )}
                            {usernameStatus === 'taken' && (
                                <X className="h-4 w-4 text-dashboard-danger" />
                            )}
                            {usernameStatus === 'invalid' && (
                                <X className="h-4 w-4 text-dashboard-danger" />
                            )}
                        </span>
                    )}
                </div>
                {usernameStatus === 'taken' && (
                    <p className="text-xs text-dashboard-danger">This username is already taken.</p>
                )}
                {usernameStatus === 'invalid' && (
                    <p className="text-xs text-dashboard-danger">
                        Only lowercase letters, numbers, hyphens, and underscores (3–30 chars)
                    </p>
                )}
                {usernameStatus === 'available' && (
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs text-dashboard-success">
                            This username is available.
                        </p>
                        <button
                            onClick={handleConfirmUsername}
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-dashboard-success underline-offset-2 hover:underline"
                        >
                            Confirm
                        </button>
                    </div>
                )}
                <p className="text-xs text-dashboard-text-placeholder">
                    Used for your site URL and tags: /{tempUsername}
                </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
                <label className="text-xs text-dashboard-text-muted">Display Name</label>
                <Input
                    type="text"
                    value={tempUser.displayName || ''}
                    onChange={(e) => setTempUser({ ...tempUser, displayName: e.target.value })}
                    placeholder="Display Name"
                    className="border-dashboard-border bg-dashboard-bg-card text-sm text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
                />
            </div>

            {/* Bio */}
            <div className="space-y-2">
                <label className="text-xs text-dashboard-text-muted">Bio</label>
                <Textarea
                    value={tempUser.bio || ''}
                    onChange={(e) => setTempUser({ ...tempUser, bio: e.target.value })}
                    placeholder="Write a short bio"
                    rows={3}
                    className="resize-none border-dashboard-border bg-dashboard-bg-card text-sm leading-relaxed text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
                />
            </div>

            {/* Region */}
            <div className="space-y-2">
                <label className="text-xs text-dashboard-text-muted">Region</label>
                <Input
                    value={tempUser.region || ''}
                    onChange={(e) => setTempUser({ ...tempUser, region: e.target.value })}
                    placeholder="e.g. Seoul, South Korea"
                    className="border-dashboard-border bg-dashboard-bg-card text-sm text-dashboard-text shadow-none placeholder:text-dashboard-text-placeholder focus-visible:ring-dashboard-border"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="rounded-lg px-3 py-1.5 text-[13px] text-dashboard-text-muted transition-colors hover:bg-dashboard-bg-hover hover:text-dashboard-text-secondary"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="rounded-lg bg-dashboard-text px-3 py-1.5 text-[13px] text-white transition-colors hover:bg-dashboard-text/90 disabled:opacity-50"
                >
                    Save
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Account Section
// ---------------------------------------------------------------------------

function AccountSettingsSection() {
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-[13px] text-dashboard-text">Sign out</h3>
                <p className="mt-1 text-xs text-dashboard-text-muted">
                    Sign out of your account on this device.
                </p>
                <button
                    onClick={handleLogout}
                    className="mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-dashboard-danger transition-colors hover:bg-dashboard-danger-bg"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                </button>
            </div>
        </div>
    );
}
