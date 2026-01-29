export interface User {
    id: string;
    username: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface Page {
    id: string;
    user_id: string;
    slug: string;
    template_type?: string;
    theme?: any;
    created_at: string;
    updated_at: string;
}

export interface Component {
    id: string;
    page_id: string;
    type: 'event' | 'mixset' | 'link' | 'text' | 'image';
    position: number;
    data: any; // 나중에 더 구체적으로 타입 지정 가능
    created_at: string;
    updated_at: string;
}

// 컴포넌트 data 타입들
export interface EventData {
    id: string;
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    description: string;
    lineup: string[];
}

export interface MixsetData {
    id: string;
    title: string;
    releaseDate: string;
    genre: string;
    coverUrl: string;
    description: string;
}
