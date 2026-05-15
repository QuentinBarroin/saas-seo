import { db } from '@/lib/db';
import { getGscMetricsByQuery, type GscQueryMetrics } from './gsc-metrics';

export type KeywordsPageData = {
  project: { id: string; name: string };
  keywords: Array<{
    id: string;
    query: string;
    cluster: string | null;
    intent: string | null;
    isMoneyKeyword: boolean;
    source: string | null;
    /** Métriques Search Console 90 j, null si aucune donnée pour cette requête. */
    gsc: GscQueryMetrics | null;
  }>;
  existingClusters: string[];
  /** true si au moins une requête GSC a été importée pour le projet. */
  hasGscData: boolean;
};

export async function getKeywordsPageData(
  projectId: string
): Promise<KeywordsPageData | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) {
    return null;
  }

  const keywords = await db.keyword.findMany({
    where: { projectId },
    select: {
      id: true,
      query: true,
      cluster: true,
      intent: true,
      isMoneyKeyword: true,
      source: true,
    },
    orderBy: [
      { isMoneyKeyword: 'desc' },
      { cluster: 'asc' },
      { query: 'asc' },
    ],
  });

  const gscMetrics = await getGscMetricsByQuery(projectId);

  const clustersSet = new Set<string>();
  for (const kw of keywords) {
    if (kw.cluster) {
      clustersSet.add(kw.cluster);
    }
  }

  return {
    project,
    keywords: keywords.map((kw) => ({
      ...kw,
      gsc: gscMetrics.get(kw.query.trim().toLowerCase()) ?? null,
    })),
    existingClusters: Array.from(clustersSet).sort(),
    hasGscData: gscMetrics.size > 0,
  };
}
