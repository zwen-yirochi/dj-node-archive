export interface EventData {
    id: string;
    title: string;
    date: string;
    venue: string;
    posterUrl: string;
    description: string;
    lineup: string[];
}

export interface Mixset {
    id: string;
    title: string;
    releaseDate: string;
    genre: string;
    coverUrl: string;
    description: string;
}
