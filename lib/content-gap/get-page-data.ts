import { db } from '@/lib/db';

export type ContentGapPageData = {
  project: { id: string; name: string; domain: string };
  recommended: Array<{
    id: string;
    cluster: string;
    slug: string | null;
    targetKeyword: string | null;
    pageType: string | null;
  }>;
  existing: Array<{
    id: string;
    cluster: string;
    url: string | null;
    slug: string | null;
    targetKeyword: string | null;
    title: string | null;
  }>;
  clustersTotal: number;
  hasAnyCluster: boolean;
};

/**
 * Récupère les données de la page content gap pour un projet.
 *
 * Retourne null si le projet n'existe pas.
 * Retourne une structure vide si le projet existe mais n'a pas de clusters/pages.
 */
export async function getContentGapPageData(
  projectId: string
): Promise<ContentGapPageData | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, domain: true },
  });

  if (!project) return null;

  const pages = await db.seoPage.findMany({
    where: { projectId, cluster: { not: null } },
    select: {
      id: true,
      cluster: true,
      url: true,
      slug: true,
      targetKeyword: true,
      title: true,
      pageType: true,
      status: true,
    },
    orderBy: { cluster: 'asc' },
  });

  const recommended = pages
    .filter((p) => p.status === 'recommended')
    .map((p) => ({
      id: p.id,
      cluster: p.cluster!,
      slug: p.slug,
      targetKeyword: p.targetKeyword,
      pageType: p.pageType,
    }));

  const existing = pages
    .filter((p) => p.status === 'existing')
    .map((p) => ({
      id: p.id,
      cluster: p.cluster!,
      url: p.url,
      slug: p.slug,
      targetKeyword: p.targetKeyword,
      title: p.title,
    }));

  const clustersAgg = await db.keyword.aggregate({
    where: { projectId, cluster: { not: null } },
    _count: { cluster: true },
  });

  const clustersTotal = clustersAgg._count.cluster;
  const hasAnyCluster = clustersTotal > 0;

  return {
    project,
    recommended,
    existing,
    clustersTotal,
    hasAnyCluster,
  };
}
