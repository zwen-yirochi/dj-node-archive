import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileHeaderProps {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
}

export default function ProfileHeader({
    username,
    displayName,
    avatarUrl,
    bio,
}: ProfileHeaderProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="px-4 pb-6 pt-12">
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-gray-800">
                    <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-gray-800 text-lg font-bold text-primary">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center">
                    <h1 className="text-3xl font-semibold tracking-wider text-primary text-shadow-def">
                        {displayName}
                    </h1>
                    <p className="mt-1 text-xs font-semibold text-primary">@{username}</p>
                    {bio && (
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-primary">
                            {bio}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
