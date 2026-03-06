import type { EmbedProvider } from './types';

export const youtube: EmbedProvider = {
    name: 'youtube',
    displayName: 'YouTube',
    regex: [/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/, /youtu\.be\/([\w-]+)/],
    toEmbedUrl: (match) => `https://www.youtube.com/embed/${match[1]}`,
    dimensions: { aspectRatio: '16/9' },
};

export const soundcloud: EmbedProvider = {
    name: 'soundcloud',
    displayName: 'SoundCloud',
    regex: [/(soundcloud\.com\/[\w-]+\/[\w-]+)/],
    toEmbedUrl: (match) =>
        `https://w.soundcloud.com/player/?url=https://${match[1]}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
    dimensions: { height: 166 },
};

export const providers: EmbedProvider[] = [youtube, soundcloud];
