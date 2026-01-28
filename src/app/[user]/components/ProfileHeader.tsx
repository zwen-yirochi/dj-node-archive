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
        <header className="px-4 pb-6 pt-12 sm:px-6 sm:pb-8 sm:pt-16 md:pb-10 md:pt-20">
            <div className="mx-auto max-w-4xl">
                <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-start md:gap-8">
                    {/* 아바타 */}
                    <Avatar className="h-20 w-20 border-2 border-gray-800 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40">
                        <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-gray-800 text-lg font-bold text-primary sm:text-xl md:text-2xl lg:text-3xl">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>

                    {/* 정보 */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-semibold tracking-wider text-primary text-shadow-def sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                            {displayName}
                        </h1>
                        <p className="mt-1 text-xs font-semibold text-primary sm:mt-2 sm:text-sm">
                            @{username}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-primary sm:text-base md:mt-4 md:text-lg">
                            {bio}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
