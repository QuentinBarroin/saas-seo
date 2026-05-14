import { db } from '@/lib/db';

export type KeywordsPageData = {
  project: { id: string; name: string };
  keywords: Array<{
    id: string;
    query: string;
    cluster: string | null;
    intent: string | null;
    isMoneyKeyword: boolean;
    source: string | null;
  }>;
  existingClusters: string[];
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

  const clustersSet = new Set<string>();
  for (const kw of keywords) {
    if (kw.cluster) {
      clustersSet.add(kw.cluster);
    }
  }

  return {
    project,
    keywords,
    existingClusters: Array.from(clustersSet).sort(),
  };
}
