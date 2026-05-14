'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';

export type UpdateKeywordState = { error?: string; success?: boolean };

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
