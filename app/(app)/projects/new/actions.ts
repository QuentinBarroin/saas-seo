'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createProject } from '@/lib/projects/create';
import { createProjectSchema } from '@/lib/projects/validation';

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
  const parsed = createProjectSchema.safeParse({
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
