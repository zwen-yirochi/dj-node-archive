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

export interface PageTheme {
    accentColor: 'pink' | 'cyan' | 'purple';
    backgroundStyle: 'gradient' | 'solid' | 'image';
    backgroundImage?: string;
}

export interface Page {
    id: string;
    user_id: string;
    slug: string;
    template_type?: string;
    theme?: PageTheme;
    created_at: string;
    updated_at: string;
}

export type ComponentType = 'show' | 'mixset' | 'link' | 'text' | 'image';

export interface LinkData {
    title: string;
    url: string;
    icon?: string;
}

export interface TextData {
    content: string;
}

export interface ImageData {
    url: string;
    alt?: string;
}

// 컴포넌트 data 타입들
export interface EventData {
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    description: string;
    lineup: string[];
}

export interface MixsetData {
    title: string;
    releaseDate: string;
    genre: string;
    coverUrl: string;
    description: string;
}

export type ComponentDataType = EventData | MixsetData | LinkData | TextData | ImageData;

export interface Component {
    id: string;
    page_id: string;
    type: ComponentType;
    position: number;
    data: ComponentDataType;
    created_at: string;
    updated_at: string;
}

// Supabase 쿼리 결과를 위한 확장 타입
export interface UserWithPages extends User {
    pages: PageWithComponents[];
}

export interface PageWithComponents extends Page {
    components: Component[];
}
