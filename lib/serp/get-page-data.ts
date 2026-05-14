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
  competitors: Array<{ domain: string; frequency: number }>;
};

/**
 * Récupère toutes les données nécessaires à la page /serp pour un projet donné.
 *
 * Concurrents : agrégation naïve sur toutes les rows SerpResult existantes (MVP).
 * Raffinement S2-08 : ne compter que les dernières fenêtres par keyword pour éviter
 * biais multi-audits.
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

  const competitorsRaw = await db.serpResult.groupBy({
    by: ['domain'],
    where: { projectId, domain: { not: project.domain } },
    _count: { domain: true },
    orderBy: { _count: { domain: 'desc' } },
    take: 20,
  });

  const competitors = competitorsRaw.map((c) => ({
    domain: c.domain,
    frequency: c._count.domain,
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
