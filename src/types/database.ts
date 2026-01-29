// types/database.ts
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
    created_at: string;
    updated_at: string;
}

export type ComponentType = 'event' | 'mixset' | 'link' | 'text' | 'image';

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

export interface PageWithComponents extends Page {
    components: Component[];
}

export interface UserWithPages extends User {
    pages: PageWithComponents[];
}

export type DBUser = User;
export type DBPage = Page;
export type DBComponent = Component;
export type DBComponentType = ComponentType;
export type DBPageWithComponents = PageWithComponents;
export type DBUserWithPages = UserWithPages;
