'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createProject } from '@/lib/projects/create';

const PROJECT_TYPES = ['saas', 'local_seo', 'marketplace', 'blog', 'lead_gen'] as const;
const BUSINESS_GOALS = ['demos', 'leads', 'inscriptions', 'ventes', 'visibilite'] as const;

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url('URL invalide').optional());

const schema = z.object({
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
  competitors: z.string().optional(),
  seedKeywords: z.string().optional(),
});

export type CreateProjectState = { error?: string };

function parseLines(input?: string): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    )
  );
}

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    domain: formData.get('domain'),
    repoUrl: formData.get('repoUrl'),
    type: formData.get('type'),
    market: formData.get('market') || 'FR',
    businessGoals: formData.getAll('businessGoals'),
    competitors: formData.get('competitors'),
    seedKeywords: formData.get('seedKeywords'),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Validation échouée' };
  }

  const project = await createProject({
    name: parsed.data.name,
    domain: parsed.data.domain,
    repoUrl: parsed.data.repoUrl,
    type: parsed.data.type,
    market: parsed.data.market,
    businessGoals: parsed.data.businessGoals,
    competitors: parseLines(parsed.data.competitors),
    seedKeywords: parseLines(parsed.data.seedKeywords),
  });

  revalidatePath('/dashboard');
  redirect(`/dashboard?projectId=${project.id}`);
}
