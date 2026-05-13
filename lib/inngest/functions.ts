import { inngest } from './client';

/**
 * Job de test pour valider que la plomberie Inngest répond.
 * À supprimer dès que `audit/run` (Sprint 1) est en place.
 */
const ping = inngest.createFunction(
  { id: 'test-ping' },
  { event: 'test/ping' },
  async ({ event, step }) => {
    await step.run('echo', () => {
      return { received: event.data.message ?? 'ok', at: new Date().toISOString() };
    });
  }
);

export const functions = [ping];
