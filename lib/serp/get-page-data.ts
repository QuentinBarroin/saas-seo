import { db } from '@/lib/db';

export type SerpPageData = {
  project: { id: string; name: string; domain: string };
  seedKeywords: string[];
  selectedKeyword: string | null;
  fetchedAt: Date | null;
  organic: Array<{
    rank: number;
    url: string;
    title: string | null;
    snippet: string | null;
    domain: string;
  }>;
  paa: string[];
  competitors: Array<{ domain: string; frequency: number; source: string }>;
};

/**
 * Récupère toutes les données nécessaires à la page /serp pour un projet donné.
 *
 * Concurrents : lecture depuis la table Competitor, mise à jour automatiquement
 * par la step competitors-detection après chaque audit SERP (S2-08).
 */
export async function getSerpPageData(
  projectId: string,
  selectedKeyword?: string
): Promise<SerpPageData | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, domain: true },
  });

  if (!project) {
    return null;
  }

  const keywords = await db.keyword.findMany({
    where: { projectId, source: 'seed' },
    select: { query: true },
    orderBy: { query: 'asc' },
  });

  const seedKeywords = keywords.map((k) => k.query);

  const selected = selectedKeyword ?? seedKeywords[0] ?? null;

  let fetchedAt: Date | null = null;
  let organic: SerpPageData['organic'] = [];
  let paa: string[] = [];

  if (selected) {
    const latestOrganicRow = await db.serpResult.findFirst({
      where: { projectId, keyword: selected },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });

    if (latestOrganicRow) {
      fetchedAt = latestOrganicRow.fetchedAt;
      const organicRows = await db.serpResult.findMany({
        where: { projectId, keyword: selected, fetchedAt: latestOrganicRow.fetchedAt },
        orderBy: { rank: 'asc' },
        select: { rank: true, url: true, title: true, snippet: true, domain: true },
      });
      organic = organicRows;
    }

    const latestPAARow = await db.serpPAA.findFirst({
      where: { projectId, keyword: selected },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });

    if (latestPAARow) {
      const paaRows = await db.serpPAA.findMany({
        where: { projectId, keyword: selected, fetchedAt: latestPAARow.fetchedAt },
        select: { question: true },
      });
      paa = paaRows.map((p) => p.question);
    }
  }

  const competitors = (
    await db.competitor.findMany({
      where: { projectId, serpFrequency: { not: null } },
      select: { domain: true, serpFrequency: true, source: true },
      orderBy: { serpFrequency: 'desc' },
      take: 20,
    })
  ).map((c) => ({
    domain: c.domain,
    frequency: c.serpFrequency ?? 0,
    source: c.source ?? 'serp_auto',
  }));

  return {
    project,
    seedKeywords,
    selectedKeyword: selected,
    fetchedAt,
    organic,
    paa,
    competitors,
  };
}
