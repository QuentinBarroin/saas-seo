import { describe, expect, it } from 'vitest';
import {
  runGscImport,
  mapGscRows,
  computeGscDateRange,
  type GscImportRow,
  type GscQueryPage,
} from '@/lib/gsc/import-step';
import type { GscRawRow } from '@/lib/connectors/gsc';

function row(date: string): GscImportRow {
  return { date, query: 'q', page: 'p', clicks: 1, impressions: 10, ctr: 0.1, position: 5 };
}

describe('gsc/import-step · runGscImport', () => {
  it('une seule page (résultat plus petit que rowLimit)', async () => {
    const queryPage: GscQueryPage = async () => ({ ok: true, rows: [row('2026-05-10')] });
    const outcome = await runGscImport(
      { startDate: '2026-02-15', endDate: '2026-05-15', maxRows: 100, rowLimit: 2 },
      queryPage
    );
    expect(outcome.rows).toHaveLength(1);
    expect(outcome.pagesFetched).toBe(1);
    expect(outcome.cappedAtMaxRows).toBe(false);
    expect(outcome.errored).toBe(false);
  });

  it('pagine tant que les pages sont pleines', async () => {
    const queryPage: GscQueryPage = async ({ startRow }) => ({
      ok: true,
      rows: startRow === 0 ? [row('2026-05-10'), row('2026-05-11')] : [row('2026-05-12')],
    });
    const outcome = await runGscImport(
      { startDate: '2026-02-15', endDate: '2026-05-15', maxRows: 100, rowLimit: 2 },
      queryPage
    );
    expect(outcome.rows).toHaveLength(3);
    expect(outcome.pagesFetched).toBe(2);
    expect(outcome.cappedAtMaxRows).toBe(false);
  });

  it('respecte le cap maxRows et tronque', async () => {
    const queryPage: GscQueryPage = async () => ({
      ok: true,
      rows: [row('2026-05-10'), row('2026-05-11')],
    });
    const outcome = await runGscImport(
      { startDate: '2026-02-15', endDate: '2026-05-15', maxRows: 3, rowLimit: 2 },
      queryPage
    );
    expect(outcome.rows).toHaveLength(3);
    expect(outcome.cappedAtMaxRows).toBe(true);
    expect(outcome.pagesFetched).toBe(2);
  });

  it('échec en cours de pagination → errored, conserve les lignes déjà collectées', async () => {
    const queryPage: GscQueryPage = async ({ startRow }) =>
      startRow === 0
        ? { ok: true, rows: [row('2026-05-10'), row('2026-05-11')] }
        : { ok: false, message: 'api_error: 500' };
    const outcome = await runGscImport(
      { startDate: '2026-02-15', endDate: '2026-05-15', maxRows: 100, rowLimit: 2 },
      queryPage
    );
    expect(outcome.errored).toBe(true);
    expect(outcome.errorMessage).toContain('api_error');
    expect(outcome.rows).toHaveLength(2);
    expect(outcome.pagesFetched).toBe(2);
  });

  it('aucune donnée → outcome cohérent', async () => {
    const queryPage: GscQueryPage = async () => ({ ok: true, rows: [] });
    const outcome = await runGscImport(
      { startDate: '2026-02-15', endDate: '2026-05-15', maxRows: 100, rowLimit: 2 },
      queryPage
    );
    expect(outcome.rows).toEqual([]);
    expect(outcome.pagesFetched).toBe(1);
    expect(outcome.errored).toBe(false);
  });
});

describe('gsc/import-step · mapGscRows', () => {
  it('résout les keys vers date/query/page', () => {
    const raw: GscRawRow[] = [
      { keys: ['2026-05-10', 'audit seo', 'https://x/p'], clicks: 3, impressions: 50, ctr: 0.06, position: 8 },
    ];
    const mapped = mapGscRows(raw);
    expect(mapped).toEqual([
      { date: '2026-05-10', query: 'audit seo', page: 'https://x/p', clicks: 3, impressions: 50, ctr: 0.06, position: 8 },
    ]);
  });

  it('écarte les lignes sans date exploitable', () => {
    const raw: GscRawRow[] = [
      { keys: ['not-a-date', 'q', 'p'], clicks: 1, impressions: 1, ctr: 1, position: 1 },
      { keys: [], clicks: 1, impressions: 1, ctr: 1, position: 1 },
      { keys: ['2026-05-10', 'q', 'p'], clicks: 1, impressions: 1, ctr: 1, position: 1 },
    ];
    expect(mapGscRows(raw)).toHaveLength(1);
  });
});

describe('gsc/import-step · computeGscDateRange', () => {
  it('couvre 90 jours glissants par défaut', () => {
    const { startDate, endDate } = computeGscDateRange(new Date('2026-05-15T12:00:00Z'));
    expect(endDate).toBe('2026-05-15');
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const spanDays =
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000;
    expect(spanDays).toBe(89);
  });

  it('accepte une fenêtre personnalisée', () => {
    const { startDate, endDate } = computeGscDateRange(new Date('2026-05-15T00:00:00Z'), 7);
    const spanDays =
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000;
    expect(spanDays).toBe(6);
  });
});
