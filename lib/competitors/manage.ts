import { db } from '@/lib/db';

export async function addCompetitor(projectId: string, domain: string): Promise<void> {
  const existing = await db.competitor.findFirst({
    where: { projectId, domain },
  });

  if (existing) {
    if (existing.source === 'serp_auto') {
      await db.competitor.update({
        where: { id: existing.id },
        data: { source: 'manual' },
      });
    }
  } else {
    await db.competitor.create({
      data: {
        projectId,
        domain,
        source: 'manual',
      },
    });
  }
}

export async function removeCompetitor(
  competitorId: string,
  projectId: string
): Promise<void> {
  await db.competitor.deleteMany({
    where: {
      id: competitorId,
      projectId,
      source: 'manual',
    },
  });
}
