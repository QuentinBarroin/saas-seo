'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { triggerAudit, ProjectNotFoundError } from '@/lib/audits/trigger';

const schema = z.object({ projectId: z.string().cuid('Invalid project id') });

export async function launchAudit(formData: FormData) {
  const parsed = schema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid form data');
  }

  try {
    await triggerAudit({ projectId: parsed.data.projectId });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      throw new Error(err.message);
    }
    throw err;
  }

  revalidatePath('/dashboard');
  redirect(`/audit-technique?projectId=${parsed.data.projectId}`);
}
