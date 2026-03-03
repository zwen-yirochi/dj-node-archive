import { z } from 'zod';

export const PROFILE_LINK_TYPES = [
    'instagram',
    'bandcamp',
    'spotify',
    'apple_music',
    'soundcloud',
    'custom',
] as const;

export const profileLinkSchema = z
    .object({
        type: z.enum(PROFILE_LINK_TYPES),
        url: z.string(),
        label: z.string().max(50).optional(),
        enabled: z.boolean().optional(),
    })
    .refine(
        (data) => {
            if (!data.url || data.url.trim() === '') return true;
            try {
                new URL(data.url);
                return true;
            } catch {
                return false;
            }
        },
        { message: '유효한 URL을 입력해 주세요', path: ['url'] }
    )
    .refine(
        (data) =>
            data.type !== 'custom' || !data.url || (data.label && data.label.trim().length > 0),
        {
            message: '커스텀 링크에는 라벨이 필요합니다',
            path: ['label'],
        }
    );

export const profileLinksArraySchema = z.array(profileLinkSchema).max(20);

export type ProfileLinkFormData = z.infer<typeof profileLinkSchema>;
