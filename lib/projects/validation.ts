import { z } from 'zod';

export const PROJECT_TYPES = ['saas', 'local_seo', 'marketplace', 'blog', 'lead_gen'] as const;
export const BUSINESS_GOALS = [
  'demos',
  'leads',
  'inscriptions',
  'ventes',
  'visibilite',
] as const;

export const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url('URL invalide').optional());

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(100),
  domain: z.string().trim().url('Domaine invalide (https://...)'),
  repoUrl: optionalUrl,
  type: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: 'Type invalide' }),
  }),
  market: z.string().trim().min(2).max(10).default('FR'),
  businessGoals: z
    .array(z.enum(BUSINESS_GOALS))
    .min(1, 'Au moins un objectif business'),
});

export const createProjectSchema = projectFormSchema.extend({
  competitors: z.string().optional(),
  seedKeywords: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type CreateProjectData = z.infer<typeof createProjectSchema>;
