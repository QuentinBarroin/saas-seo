import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'saas-audit-seo',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type Events = {
  'audit/requested': { data: { auditId: string; projectId: string } };
  'test/ping': { data: { message?: string } };
};
