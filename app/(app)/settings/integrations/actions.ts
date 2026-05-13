'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { testCredentials, type TestCredentialsResult } from '@/lib/connectors/dataforseo';
import { setDataForSeoCredentials } from '@/lib/projects/integrations';
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

const INITIAL: SaveDataForSeoState = { status: 'idle' };

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

export { INITIAL as INITIAL_DATAFORSEO_STATE };
