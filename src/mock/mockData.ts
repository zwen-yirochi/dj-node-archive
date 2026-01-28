export const user = 'DJ XXX';

export const userData = {
    username: user,
    displayName: user.toUpperCase(),
    bio: 'DJ & Producer based in Seoul',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
};

// 임시 공연 데이터
export const events = [
    {
        id: '1',
        title: 'NIGHT SESSION',
        date: '2024-12-31',
        venue: 'Club Octagon',
        posterUrl: 'https://picsum.photos/seed/show1/800/600',
        description: '연말을 마무리하는 특별한 밤',
        lineup: ['@dj1', '@dj2', '@dj3'],
    },
    {
        id: '2',
        title: 'WAREHOUSE PARTY',
        date: '2024-11-15',
        venue: 'Secret Location',
        posterUrl: 'https://picsum.photos/seed/show2/800/600',
        description: '언더그라운드 테크노 파티',
        lineup: ['@producer1', '@dj4'],
    },
    {
        id: '3',
        title: 'SUMMER FESTIVAL',
        date: '2024-08-20',
        venue: 'Beach Club',
        posterUrl: 'https://picsum.photos/seed/show3/800/600',
        description: '여름 페스티벌',
        lineup: ['@dj5', '@dj6'],
    },
];

// 임시 믹스셋 데이터
export const mixsets = [
    {
        id: '1',
        title: 'Winter Mix 2024',
        releaseDate: '2024-12-01',
        genre: 'House',
        coverUrl: 'https://picsum.photos/seed/mix1/600/600',
        description: '겨울을 위한 따뜻한 하우스 믹스',
    },
    {
        id: '2',
        title: 'Techno Essentials',
        releaseDate: '2024-11-20',
        genre: 'Techno',
        coverUrl: 'https://picsum.photos/seed/mix2/600/600',
        description: '순수 테크노 사운드',
    },
];
