import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'saas-audit-seo',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type Events = {
  /** Déclenche un audit (S1-07). Persiste findings + scores en DB. */
  'audit/run': { data: { auditId: string; projectId: string } };
  /** Job de test minimal pour vérifier la plomberie Inngest. */
  'test/ping': { data: { message?: string } };
};
