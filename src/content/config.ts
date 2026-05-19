import { defineCollection, z } from 'astro:content';

// v84 — Newsroom collection. Content is canonical at the ASTL National
// repo (schooltrustlands); this collection is synced via the prebuild
// hook in package.json. Schema mirrors ASTL's so the same .md files
// validate in both repos.
const newsroom = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
    weekOf: z.string().optional(),
    title: z.string(),
    kicker: z.string(),
    cadence: z.enum(['weekly', 'monthly']),
    itemsCovered: z.union([z.number(), z.array(z.string())]).optional(),
  }),
});

export const collections = { newsroom };
