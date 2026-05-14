import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type GenerateRecommendationsInput = {
  projectId: string;
};

export type GenerateRecommendationsOutput = {
  clustersScanned: number;
  pagesRecommended: number;
  pagesMatched: number;
  clustersWithoutKeyword: number;
};

/**
 * Génère les recommandations de content gap à partir des clusters de keywords.
 *
 * Logique :
 * 1. Récupère les clusters distincts du projet (via Keyword).
 * 2. Pour chaque cluster :
 *    - Détermine le targetKeyword (money keyword si présent, sinon premier keyword).
 *    - Calcule un slug basé sur le nom du cluster.
 *    - Vérifie si une SeoPage existe déjà pour ce cluster.
 *    - Crée ou met à jour la page (status recommended si nouvelle, preservé si existing).
 *
 * Idempotence : rejouer la step stabilise l'état. Pas de DELETE car les pages
 * existing peuvent être créées manuellement. Les pages recommended sont mises à jour
 * (slug + targetKeyword) si le cluster change.
 */
export async function generateContentGapRecommendations(
  db: DbClient,
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsOutput> {
  const { projectId } = input;

  const clusterRows = await db.keyword.findMany({
    where: { projectId, cluster: { not: null } },
    select: { cluster: true },
    distinct: ['cluster'],
  });

  if (clusterRows.length === 0) {
    return {
      clustersScanned: 0,
      pagesRecommended: 0,
      pagesMatched: 0,
      clustersWithoutKeyword: 0,
    };
  }

  let pagesRecommended = 0;
  let pagesMatched = 0;
  let clustersWithoutKeyword = 0;

  for (const row of clusterRows) {
    if (!row.cluster) continue;
    const cluster = row.cluster;

    const keywords = await db.keyword.findMany({
      where: { projectId, cluster },
      select: { query: true, isMoneyKeyword: true },
      orderBy: [{ isMoneyKeyword: 'desc' }, { query: 'asc' }],
    });

    if (keywords.length === 0) {
      clustersWithoutKeyword++;
      continue;
    }

    const targetKeyword = keywords[0]?.query;
    if (!targetKeyword) {
      clustersWithoutKeyword++;
      continue;
    }

    const slug = normalizeSlug(cluster);

    const existingPage = await db.seoPage.findFirst({
      where: { projectId, cluster },
      select: { id: true, status: true },
    });

    if (existingPage) {
      await db.seoPage.update({
        where: { id: existingPage.id },
        data: {
          targetKeyword,
          ...(existingPage.status === 'recommended' && { slug }),
        },
      });

      if (existingPage.status === 'existing') {
        pagesMatched++;
      } else if (existingPage.status === 'recommended') {
        pagesRecommended++;
      }
    } else {
      await db.seoPage.create({
        data: {
          projectId,
          cluster,
          targetKeyword,
          slug,
          status: 'recommended',
          pageType: null,
        },
      });
      pagesRecommended++;
    }
  }

  return {
    clustersScanned: clusterRows.length,
    pagesRecommended,
    pagesMatched,
    clustersWithoutKeyword,
  };
}

/**
 * Normalise un nom de cluster en slug :
 * - Minuscules
 * - Remplacement [^a-z0-9]+ par '-'
 * - Trim leading/trailing '-'
 * - Fallback 'cluster-{random}' si vide
 */
function normalizeSlug(cluster: string): string {
  const clean = cluster
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || `cluster-${Math.random().toString(36).slice(2, 9)}`;
}
