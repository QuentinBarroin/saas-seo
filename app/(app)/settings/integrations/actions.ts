'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { testCredentials, type TestCredentialsResult } from '@/lib/connectors/dataforseo';
import {
  setDataForSeoCredentials,
  setGscProperty,
  disconnectGsc,
} from '@/lib/projects/integrations';
import { db } from '@/lib/db';

const schema = z.object({
  projectId: z.string().cuid('Invalid project id'),
  login: z.string().trim().min(1, 'Login requis'),
  password: z.string().min(1, 'Password requis'),
});

export type SaveDataForSeoState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  account?: {
    login: string;
    balance?: string;
  };
};

export async function saveAndTestDataForSeoCredentials(
  _prev: SaveDataForSeoState,
  formData: FormData
): Promise<SaveDataForSeoState> {
  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    login: formData.get('login'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Validation échouée',
    };
  }

  const { projectId, login, password } = parsed.data;

  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return { status: 'error', message: 'Projet introuvable' };
  }

  const result: TestCredentialsResult = await testCredentials({ login, password });
  if (!result.ok) {
    return {
      status: 'error',
      message: `Test échoué (${result.reason}) : ${result.message}`,
    };
  }

  await setDataForSeoCredentials(projectId, { login, password });
  revalidatePath('/settings/integrations');

  const balance = result.account.money?.balance;
  const currency = result.account.money?.currency ?? '';
  return {
    status: 'success',
    message: 'Credentials DataForSEO sauvegardés (chiffrés en DB).',
    account: {
      login: result.account.login,
      ...(typeof balance === 'number'
        ? { balance: `${balance.toFixed(2)} ${currency}`.trim() }
        : {}),
    },
  };
}

/* ─── GSC (S2-02) ───────────────────────────────────────────────────────
 * Le flow OAuth lui-même passe par des routes HTTP (redirections navigateur,
 * impossibles en Server Action). L'association de propriété et la déconnexion
 * sont des Server Actions — cohérent avec le pattern des formulaires du repo.
 */

const gscPropertySchema = z.object({
  projectId: z.string().cuid('Invalid project id'),
  siteUrl: z.string().trim().min(1, 'Propriété requise'),
});

/** Associe une propriété GSC au projet (formulaire `<select>` simple). */
export async function associateGscPropertyAction(formData: FormData): Promise<void> {
  const parsed = gscPropertySchema.safeParse({
    projectId: formData.get('projectId'),
    siteUrl: formData.get('siteUrl'),
  });
  if (!parsed.success) return;

  await setGscProperty(parsed.data.projectId, parsed.data.siteUrl);
  revalidatePath('/settings/integrations');
}

const gscDisconnectSchema = z.object({
  projectId: z.string().cuid('Invalid project id'),
});

/** Supprime la connexion GSC du projet (refresh token + propriété). */
export async function disconnectGscAction(formData: FormData): Promise<void> {
  const parsed = gscDisconnectSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) return;

  await disconnectGsc(parsed.data.projectId);
  revalidatePath('/settings/integrations');
}
