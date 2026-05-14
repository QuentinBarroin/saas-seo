import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type DetectFromSerpInput = {
  projectId: string;
  projectDomain: string;
};

export type DetectFromSerpOutput = {
  domainsDetected: number;
  serpAutoCreated: number;
  manualUpdated: number;
  serpAutoPurged: number;
};

/**
 * Détecte et persiste les concurrents à partir des résultats SERP.
 *
 * Stratégie (idempotent) :
 * 1. Purge tous les anciens serp_auto (seront recréés s'ils sont dans le top).
 * 2. Reset serpFrequency des manual à null (seront re-set s'ils sont dans le top).
 * 3. Agrège les domaines par fréquence dans SerpResult (excluant le domaine du projet).
 * 4. Upsert chaque domaine (create serp_auto ou update serpFrequency).
 *
 * L'idempotence est garantie par delete-then-recreate : rejouer la step après crash
 * stabilise l'état final.
 */
export async function detectCompetitorsFromSerp(
  db: DbClient,
  input: DetectFromSerpInput
): Promise<DetectFromSerpOutput> {
  const { projectId, projectDomain } = input;

  const purgeResult = await db.competitor.deleteMany({
    where: { projectId, source: 'serp_auto' },
  });

  await db.competitor.updateMany({
    where: { projectId, source: 'manual' },
    data: { serpFrequency: null },
  });

  const manualDomains = new Set(
    (
      await db.competitor.findMany({
        where: { projectId, source: 'manual' },
        select: { domain: true },
      })
    ).map((c) => c.domain)
  );

  const counts = await db.serpResult.groupBy({
    by: ['domain'],
    where: { projectId, domain: { not: projectDomain } },
    _count: { domain: true },
  });

  let serpAutoCreated = 0;
  let manualUpdated = 0;

  for (const c of counts) {
    await db.competitor.upsert({
      where: { projectId_domain: { projectId, domain: c.domain } },
      update: { serpFrequency: c._count.domain },
      create: {
        projectId,
        domain: c.domain,
        source: 'serp_auto',
        serpFrequency: c._count.domain,
      },
    });

    if (manualDomains.has(c.domain)) {
      manualUpdated++;
    } else {
      serpAutoCreated++;
    }
  }

  return {
    domainsDetected: counts.length,
    serpAutoCreated,
    manualUpdated,
    serpAutoPurged: purgeResult.count,
  };
}
