import { inngest } from './client';
import { runAudit } from './functions/run-audit';

/**
 * Job de test pour vérifier la plomberie Inngest (`test/ping`).
 * Utile pendant le dev pour valider que l'endpoint répond.
 */
const ping = inngest.createFunction(
  { id: 'test-ping' },
  { event: 'test/ping' },
  async ({ event, step }) =>
    step.run('echo', () => ({
      received: event.data.message ?? 'ok',
      at: new Date().toISOString(),
    }))
);

export const functions = [ping, runAudit];
