import { db } from '@/lib/db';
import type { GscImportRow } from '@/lib/gsc/import-step';

/**
 * Persiste les statistiques GSC d'un audit (S2-03).
 *
 * Idempotence : DELETE-then-INSERT par `projectId` + fenêtre de dates. Rejouer
 * la step Inngest `import-gsc` (retry) ne crée pas de doublons. Les inserts
 * sont découpés en chunks pour rester sous la limite de paramètres Postgres.
 */

const INSERT_CHUNK = 5_000;
/** Marge confortable pour un import volumineux (jusqu'à 100k lignes). */
const TX_TIMEOUT_MS = 120_000;

export type ReplaceGscResult = { inserted: number };

export async function replaceGscStats(
  projectId: string,
  range: { startDate: string; endDate: string },
  rows: GscImportRow[]
): Promise<ReplaceGscResult> {
  const start = new Date(`${range.startDate}T00:00:00.000Z`);
  const end = new Date(`${range.endDate}T23:59:59.999Z`);

  return db.$transaction(
    async (tx) => {
      await tx.gscQueryStat.deleteMany({
        where: { projectId, date: { gte: start, lte: end } },
      });

      let inserted = 0;
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK);
        await tx.gscQueryStat.createMany({
          data: chunk.map((r) => ({
            projectId,
            date: new Date(`${r.date}T00:00:00.000Z`),
            query: r.query || null,
            page: r.page || null,
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          })),
        });
        inserted += chunk.length;
      }

      return { inserted };
    },
    { timeout: TX_TIMEOUT_MS }
  );
}
