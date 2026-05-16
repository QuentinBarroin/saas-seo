import { db } from '@/lib/db';

export type SeoPageRow = {
  id: string;
  url: string | null;
  slug: string | null;
  pageType: string | null;
  targetKeyword: string | null;
  cluster: string | null;
  status: string;
  wordCount: number | null;
  indexable: boolean | null;
  technicalScore: number | null;
  contentScore: number | null;
};

export type PagesListData = {
  project: { id: string; name: string; domain: string };
  pages: SeoPageRow[];
  counts: {
    total: number;
    byStatus: Record<string, number>;
  };
};

/** Ordre d'affichage des statuts : à traiter d'abord, puis acquis. */
const STATUS_ORDER: Record<string, number> = {
  recommended: 0,
  in_progress: 1,
  existing: 2,
  done: 3,
};

/**
 * Charge la liste des fiches `SeoPage` d'un projet (L1-17, index `/pages`).
 *
 * Retourne `null` si le projet n'existe pas. Les compteurs `byStatus` portent
 * sur l'ensemble des pages (non filtré) pour que les filtres de statut
 * affichent une distribution stable.
 */
export async function getPagesList(
  projectId: string,
  filters?: { status?: string }
): Promise<PagesListData | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, domain: true },
  });
  if (!project) return null;

  const allPages = await db.seoPage.findMany({
    where: { projectId },
    select: {
      id: true,
      url: true,
      slug: true,
      pageType: true,
      targetKeyword: true,
      cluster: true,
      status: true,
      wordCount: true,
      indexable: true,
      technicalScore: true,
      contentScore: true,
    },
  });

  const byStatus: Record<string, number> = {};
  for (const page of allPages) {
    byStatus[page.status] = (byStatus[page.status] ?? 0) + 1;
  }

  const visible = filters?.status
    ? allPages.filter((p) => p.status === filters.status)
    : allPages;

  const pages = [...visible].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) ||
      (a.cluster ?? '').localeCompare(b.cluster ?? '') ||
      (a.slug ?? a.url ?? '').localeCompare(b.slug ?? b.url ?? '')
  );

  return {
    project,
    pages,
    counts: { total: allPages.length, byStatus },
  };
}
