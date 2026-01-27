import Image from 'next/image';

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
    return (
        <header className="px-6 pb-12 pt-20">
            <div className="mx-auto max-w-4xl">
                <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-800 md:h-40 md:w-40">
                        <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-5xl font-bold tracking-wider text-pink-500 md:text-7xl">
                            {displayName}
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">@{username}</p>
                        <p className="mt-4 text-lg text-gray-300">{bio}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
