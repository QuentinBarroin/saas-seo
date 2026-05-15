'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { addSeedKeywords } from '@/lib/keywords/manage';
import { suggestSeedKeywords } from '@/lib/keywords/suggest';
import { getProjectById } from '@/lib/projects/get-by-id';

export type UpdateKeywordState = { error?: string; success?: boolean };
export type SeedAddState = { error?: string; inserted?: number };
export type SuggestState = { error?: string; suggestions?: string[] };

const updateKeywordSchema = z.object({
  keywordId: z.string().cuid('Invalid keyword id'),
  projectId: z.string().cuid('Invalid project id'),
  cluster: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  intent: z
    .enum(['tofu', 'mofu', 'bofu', 'navigational'])
    .nullable()
    .optional(),
  isMoneyKeyword: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
});

export async function updateKeywordAction(
  _prev: UpdateKeywordState,
  formData: FormData
): Promise<UpdateKeywordState> {
  const parsed = updateKeywordSchema.safeParse({
    keywordId: formData.get('keywordId'),
    projectId: formData.get('projectId'),
    cluster: formData.get('cluster'),
    intent: formData.get('intent') || null,
    isMoneyKeyword: formData.get('isMoneyKeyword'),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Validation échouée',
    };
  }

  const { keywordId, projectId, cluster, intent, isMoneyKeyword } = parsed.data;

  try {
    await db.keyword.update({
      where: {
        id: keywordId,
        projectId,
      },
      data: {
        cluster,
        intent,
        isMoneyKeyword,
      },
    });
  } catch {
    return { error: 'Échec de mise à jour' };
  }

  revalidatePath('/keywords');
  return { success: true };
}

/* ─── Seed keywords : ajout + suggestion IA (S2-07 / PDR-013) ──────────────
 * Ces actions servent à la fois la page /keywords et l'édition de projet —
 * elles vivent donc ici (dossier keywords) et revalident les deux écrans.
 */

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

const addSeedKeywordsSchema = z.object({
  projectId: z.string().min(1),
  keywords: z.string().min(1, 'Au moins un mot-clé requis'),
});

/** Ajoute des seed keywords (saisie manuelle ou sélection IA). */
export async function addSeedKeywordsAction(
  _prev: SeedAddState,
  formData: FormData
): Promise<SeedAddState> {
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

  revalidatePath('/keywords');
  revalidatePath(`/projects/${parsed.data.projectId}/edit`);

  return { inserted: result.inserted };
}

const suggestKeywordsSchema = z.object({
  projectId: z.string().min(1),
});

/**
 * Suggère des seed keywords via Claude à partir du contexte projet (PDR-013).
 * Ne persiste rien — l'utilisateur curera la liste avant `addSeedKeywordsAction`.
 */
export async function suggestKeywordsAction(
  _prev: SuggestState,
  formData: FormData
): Promise<SuggestState> {
  const parsed = suggestKeywordsSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) {
    return { error: 'Projet invalide' };
  }

  const project = await getProjectById(parsed.data.projectId);
  if (!project) {
    return { error: 'Projet introuvable' };
  }

  const result = await suggestSeedKeywords({
    name: project.name,
    domain: project.domain,
    type: project.type,
    businessGoal: project.businessGoal,
    market: project.market,
  });

  if (!result.ok) {
    const message =
      result.reason === 'no_api_key'
        ? 'Clé Anthropic non configurée (ANTHROPIC_API_KEY) — voir .env.'
        : `Suggestion échouée (${result.reason}) : ${result.message}`;
    return { error: message };
  }

  return { suggestions: result.keywords };
}

const bulkAssignClusterSchema = z.object({
  projectId: z.string().cuid('Invalid project id'),
  keywordIds: z.array(z.string().cuid()).min(1, 'Sélectionne au moins 1 keyword'),
  clusterName: z.string().trim().min(1, 'Nom de cluster requis'),
});

export async function bulkAssignClusterAction(
  _prev: UpdateKeywordState,
  formData: FormData
): Promise<UpdateKeywordState> {
  const keywordIds = formData.getAll('keywordIds');

  const parsed = bulkAssignClusterSchema.safeParse({
    projectId: formData.get('projectId'),
    keywordIds,
    clusterName: formData.get('clusterName'),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Validation échouée',
    };
  }

  const { projectId, keywordIds: ids, clusterName } = parsed.data;

  try {
    await db.keyword.updateMany({
      where: {
        id: { in: ids },
        projectId,
      },
      data: {
        cluster: clusterName,
      },
    });
  } catch {
    return { error: 'Échec de mise à jour bulk' };
  }

  revalidatePath('/keywords');
  return { success: true };
}
