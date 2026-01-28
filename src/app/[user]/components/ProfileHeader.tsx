import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileHeaderProps {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
}

export default function ProfileHeader({
    username,
    displayName,
    bio,
    avatarUrl,
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
        <header className="px-6 pb-4 pt-20">
            <div className="mx-auto max-w-4xl">
                <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                    <Avatar className="h-32 w-32 border-2 border-gray-800 md:h-40 md:w-40">
                        <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-gray-800 text-2xl font-bold text-primary md:text-3xl">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-5xl font-semibold tracking-wider text-primary text-shadow-def md:text-7xl">
                            {displayName}
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-primary">@{username}</p>
                        <p className="mt-4 text-lg font-semibold text-primary">{bio}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
