import { db } from '@/lib/db';
import { inngest } from '@/lib/inngest/client';
import { createPendingAudit } from './persist';

export type TriggerAuditInput = {
  projectId: string;
};

export type TriggerAuditResult = {
  auditId: string;
  status: 'queued';
};

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * Crée un audit en `pending`, émet `audit/run` côté Inngest.
 * Le worker Inngest (lib/inngest/functions/run-audit.ts) prend le relais.
 *
 * NB : auth doit être validée par le caller (Server Action ou route handler).
 * Cette fonction reste agnostique de l'identité — mono-user en MVP.
 */
export async function triggerAudit({ projectId }: TriggerAuditInput): Promise<TriggerAuditResult> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) throw new ProjectNotFoundError(projectId);

  const auditId = await createPendingAudit(projectId);
  await inngest.send({ name: 'audit/run', data: { auditId, projectId } });

  return { auditId, status: 'queued' };
}
