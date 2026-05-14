'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateProject } from '@/lib/projects/update';
import { deleteProject } from '@/lib/projects/delete';
import { addCompetitor, removeCompetitor } from '@/lib/competitors/manage';
import { addSeedKeywords, removeSeedKeyword } from '@/lib/keywords/manage';
import { projectFormSchema } from '@/lib/projects/validation';

export type ActionState = { error?: string; inserted?: number };

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

const updateProjectFormSchema = projectFormSchema.extend({
  id: z.string().min(1),
});

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateProjectFormSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    domain: formData.get('domain'),
    repoUrl: formData.get('repoUrl'),
    type: formData.get('type'),
    market: formData.get('market') || 'FR',
    businessGoals: formData.getAll('businessGoals'),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Validation échouée' };
  }

  await updateProject({
    id: parsed.data.id,
    name: parsed.data.name,
    domain: parsed.data.domain,
    repoUrl: parsed.data.repoUrl,
    type: parsed.data.type,
    market: parsed.data.market,
    businessGoals: parsed.data.businessGoals,
  });

  revalidatePath(`/projects/${parsed.data.id}/edit`);
  revalidatePath('/dashboard');

  return {};
}

const deleteProjectSchema = z.object({
  id: z.string().min(1),
});

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const parsed = deleteProjectSchema.safeParse({
    id: formData.get('id'),
  });

  if (!parsed.success) {
    throw new Error('ID invalide');
  }

  await deleteProject(parsed.data.id);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

const addCompetitorSchema = z.object({
  projectId: z.string().min(1),
  domain: z.string().trim().min(1, 'Domaine requis'),
});

export async function addCompetitorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = addCompetitorSchema.safeParse({
    projectId: formData.get('projectId'),
    domain: formData.get('domain'),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Validation échouée' };
  }

  await addCompetitor(parsed.data.projectId, parsed.data.domain);

  revalidatePath(`/projects/${parsed.data.projectId}/edit`);

  return {};
}

const removeCompetitorSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
});

export async function removeCompetitorAction(formData: FormData): Promise<void> {
  const parsed = removeCompetitorSchema.safeParse({
    id: formData.get('id'),
    projectId: formData.get('projectId'),
  });

  if (!parsed.success) {
    throw new Error('Données invalides');
  }

  await removeCompetitor(parsed.data.id, parsed.data.projectId);

  revalidatePath(`/projects/${parsed.data.projectId}/edit`);
}

const addSeedKeywordsSchema = z.object({
  projectId: z.string().min(1),
  keywords: z.string().min(1, 'Au moins un mot-clé requis'),
});

export async function addSeedKeywordsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = addSeedKeywordsSchema.safeParse({
    projectId: formData.get('projectId'),
    keywords: formData.get('keywords'),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Validation échouée' };
  }

  const queries = parseLines(parsed.data.keywords);
  if (queries.length === 0) {
    return { error: 'Au moins un mot-clé requis' };
  }

  const result = await addSeedKeywords(parsed.data.projectId, queries);

  revalidatePath(`/projects/${parsed.data.projectId}/edit`);

  return { inserted: result.inserted };
}

const removeSeedKeywordSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
});

export async function removeSeedKeywordAction(formData: FormData): Promise<void> {
  const parsed = removeSeedKeywordSchema.safeParse({
    id: formData.get('id'),
    projectId: formData.get('projectId'),
  });

  if (!parsed.success) {
    throw new Error('Données invalides');
  }

  await removeSeedKeyword(parsed.data.id, parsed.data.projectId);

  revalidatePath(`/projects/${parsed.data.projectId}/edit`);
}
