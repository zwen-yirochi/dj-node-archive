import { z } from 'zod';

export const sectionSchema = z.object({
    id: z.string().uuid(),
    viewType: z.enum(['carousel', 'list', 'grid', 'feature']),
    title: z.string().nullable(),
    entryIds: z.array(z.string()).max(50),
    isVisible: z.boolean(),
    options: z.record(z.unknown()),
});

export const updateSectionsRequestSchema = z.object({
    sections: z.array(sectionSchema).max(20),
});

export type UpdateSectionsRequest = z.infer<typeof updateSectionsRequestSchema>;
