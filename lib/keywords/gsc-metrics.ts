import { db } from '@/lib/db';

/**
 * Agrégation des stats GSC par requête (S2-07).
 *
 * Enrichit les keywords seed de la page `/keywords` avec leurs métriques
 * Search Console sur une fenêtre glissante. Pas de promotion des requêtes GSC
 * en records `Keyword` — décision PDR-012 (option A, MVP).
 */

export type GscQueryMetrics = {
  clicks: number;
  impressions: number;
  /** clics / impressions sur la fenêtre (0 si aucune impression). */
  ctr: number;
  /**
   * Position moyenne pondérée par les impressions — aligné sur le calcul de
   * Search Console (une moyenne simple sur-pondérerait les jours/pages à
   * faible volume).
   */
  position: number;
};

type GscMetricRow = {
  query: string | null;
  clicks: number;
  impressions: number;
  position: number;
};

/**
 * Agrège des lignes `GscQueryStat` par requête. Clé normalisée en minuscules
 * (les requêtes GSC sont déjà en minuscules, mais les seed keywords saisis à
 * la main peuvent avoir une casse différente — la jointure doit tenir).
 */
export function aggregateGscByQuery(rows: GscMetricRow[]): Map<string, GscQueryMetrics> {
  type Acc = {
    clicks: number;
    impressions: number;
    positionWeighted: number;
    positionSimpleSum: number;
    rowCount: number;
  };
  const acc = new Map<string, Acc>();

  for (const row of rows) {
    const key = row.query?.trim().toLowerCase();
    if (!key) continue;
    const a =
      acc.get(key) ??
      { clicks: 0, impressions: 0, positionWeighted: 0, positionSimpleSum: 0, rowCount: 0 };
    a.clicks += row.clicks;
    a.impressions += row.impressions;
    a.positionWeighted += row.position * row.impressions;
    a.positionSimpleSum += row.position;
    a.rowCount += 1;
    acc.set(key, a);
  }

  const result = new Map<string, GscQueryMetrics>();
  for (const [key, a] of acc) {
    // Sans impressions, la pondération est indéfinie → repli sur la moyenne simple.
    const position =
      a.impressions > 0
        ? a.positionWeighted / a.impressions
        : a.rowCount > 0
          ? a.positionSimpleSum / a.rowCount
          : 0;
    result.set(key, {
      clicks: a.clicks,
      impressions: a.impressions,
      ctr: a.impressions > 0 ? a.clicks / a.impressions : 0,
      position,
    });
  }
  return result;
}

/**
 * Charge et agrège les stats GSC d'un projet sur `windowDays` jours glissants.
 * Renvoie une Map vide si aucune donnée n'a encore été importée.
 */
export async function getGscMetricsByQuery(
  projectId: string,
  windowDays = 90
): Promise<Map<string, GscQueryMetrics>> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await db.gscQueryStat.findMany({
    where: { projectId, date: { gte: since } },
    select: { query: true, clicks: true, impressions: true, position: true },
  });
  return aggregateGscByQuery(rows);
}
