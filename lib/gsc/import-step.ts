import type { GscRawRow } from '@/lib/connectors/gsc';

/**
 * Import GSC 90 jours (S2-03).
 *
 * Orchestration pure et testable : `runGscImport` pagine via une fonction
 * `queryPage` injectée (le wiring réseau + token est fait par l'appelant dans
 * la step Inngest). Cap dur `maxRows` pour éviter d'importer un volume
 * disproportionné.
 */

/** Ordre des dimensions demandées à l'API Search Analytics. */
export const GSC_DIMENSIONS = ['date', 'query', 'page'] as const;

/** Taille de page max autorisée par l'API GSC searchAnalytics. */
export const GSC_ROW_LIMIT = 25_000;

/** Une ligne d'import normalisée (dimensions résolues). */
export type GscImportRow = {
  /** Format `YYYY-MM-DD`. */
  date: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscImportConfig = {
  startDate: string;
  endDate: string;
  /** Nombre max de lignes à conserver (cap budget/volume). */
  maxRows: number;
  /** Taille de page ; bornée à GSC_ROW_LIMIT. */
  rowLimit?: number;
};

export type GscQueryPageResult =
  | { ok: true; rows: GscImportRow[] }
  | { ok: false; message: string };

export type GscQueryPage = (params: {
  startDate: string;
  endDate: string;
  startRow: number;
  rowLimit: number;
}) => Promise<GscQueryPageResult>;

export type GscImportOutcome = {
  rows: GscImportRow[];
  pagesFetched: number;
  /** true si le cap `maxRows` a été atteint (des lignes peuvent manquer). */
  cappedAtMaxRows: boolean;
  errored: boolean;
  errorMessage?: string;
};

/**
 * Mappe les lignes brutes GSC vers des `GscImportRow`. Les `keys` suivent
 * l'ordre de `GSC_DIMENSIONS`. Les lignes sans date exploitable sont écartées
 * (impossible de les persister — `date` est une colonne requise).
 */
export function mapGscRows(raw: GscRawRow[]): GscImportRow[] {
  const rows: GscImportRow[] = [];
  for (const r of raw) {
    const date = r.keys[0] ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    rows.push({
      date,
      query: r.keys[1] ?? '',
      page: r.keys[2] ?? '',
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    });
  }
  return rows;
}

/**
 * Calcule la fenêtre d'import : `days` jours glissants jusqu'à aujourd'hui.
 * GSC tolère un endDate récent (renvoie les données finalisées disponibles).
 */
export function computeGscDateRange(
  now: Date = new Date(),
  days = 90
): { startDate: string; endDate: string } {
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(now);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: toIso(start), endDate: toIso(end) };
}

/**
 * Pagine l'import GSC jusqu'à épuisement ou cap `maxRows`.
 *
 * Idempotent côté appelant : la persistance fait DELETE-then-INSERT par
 * fenêtre de dates, donc rejouer la step ne crée pas de doublons.
 */
export async function runGscImport(
  config: GscImportConfig,
  queryPage: GscQueryPage
): Promise<GscImportOutcome> {
  const rowLimit = Math.min(config.rowLimit ?? GSC_ROW_LIMIT, GSC_ROW_LIMIT);
  const collected: GscImportRow[] = [];
  let startRow = 0;
  let pagesFetched = 0;
  let cappedAtMaxRows = false;

  while (true) {
    const result = await queryPage({
      startDate: config.startDate,
      endDate: config.endDate,
      startRow,
      rowLimit,
    });
    pagesFetched += 1;

    if (!result.ok) {
      return {
        rows: collected,
        pagesFetched,
        cappedAtMaxRows,
        errored: true,
        errorMessage: result.message,
      };
    }

    collected.push(...result.rows);

    if (collected.length >= config.maxRows) {
      collected.length = config.maxRows;
      cappedAtMaxRows = true;
      break;
    }

    // Une page incomplète signale la fin du jeu de résultats.
    if (result.rows.length < rowLimit) break;

    startRow += rowLimit;
  }

  return { rows: collected, pagesFetched, cappedAtMaxRows, errored: false };
}
