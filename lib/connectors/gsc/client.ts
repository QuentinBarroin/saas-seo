import { request } from 'undici';
import { z } from 'zod';
import type { GscError, GscFetcher, GscRawRow, GscSite } from './types';

/** Base de l'API Search Console v3. */
export const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';
const DEFAULT_TIMEOUT_MS = 20_000;

/** Fetcher par défaut basé sur undici. Pour les tests, injecter un mock. */
export const undiciFetcher: GscFetcher = async (url, init) => {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await request(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: init.signal ?? ctrl.signal,
    });
    const text = await res.body.text();
    return { status: res.statusCode, body: text };
  } finally {
    clearTimeout(timeout);
  }
};

function bearer(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}`, accept: 'application/json' };
}

/** Mappe un statut HTTP d'erreur Google vers une raison normalisée. */
function classifyHttpError(status: number): GscError['reason'] {
  if (status === 401 || status === 403) return 'unauthorized';
  return 'api_error';
}

const sitesResponseSchema = z.object({
  siteEntry: z
    .array(
      z.object({
        siteUrl: z.string().min(1),
        permissionLevel: z.string().optional().default('unknown'),
      })
    )
    .optional()
    .default([]),
});

export type GscSitesResult = { ok: true; sites: GscSite[] } | GscError;

/** Liste les propriétés Search Console accessibles avec cet access token. */
export async function listSites(
  accessToken: string,
  fetcher: GscFetcher = undiciFetcher
): Promise<GscSitesResult> {
  let response;
  try {
    response = await fetcher(`${GSC_API_BASE}/sites`, {
      method: 'GET',
      headers: bearer(accessToken),
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      status: 0,
      message: err instanceof Error ? err.message : 'Erreur réseau GSC',
    };
  }

  if (response.status >= 400) {
    return {
      ok: false,
      reason: classifyHttpError(response.status),
      status: response.status,
      message: `Erreur API GSC sites (${response.status})`,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch {
    return { ok: false, reason: 'invalid_response', status: response.status, message: 'Réponse GSC non-JSON' };
  }

  const parsed = sitesResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Shape de réponse GSC sites inattendue',
    };
  }

  return {
    ok: true,
    sites: parsed.data.siteEntry.map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    })),
  };
}

const searchAnalyticsResponseSchema = z.object({
  rows: z
    .array(
      z.object({
        keys: z.array(z.string()).optional().default([]),
        clicks: z.number().optional().default(0),
        impressions: z.number().optional().default(0),
        ctr: z.number().optional().default(0),
        position: z.number().optional().default(0),
      })
    )
    .optional()
    .default([]),
});

export type GscSearchAnalyticsQuery = {
  startDate: string;
  endDate: string;
  dimensions: string[];
  startRow: number;
  rowLimit: number;
};

export type GscSearchAnalyticsResult = { ok: true; rows: GscRawRow[] } | GscError;

/**
 * Interroge l'API Search Analytics pour une propriété donnée.
 * Renvoie les lignes brutes ; le mapping `keys → dimensions` est fait par
 * l'appelant qui connaît l'ordre des dimensions demandées.
 */
export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  query: GscSearchAnalyticsQuery,
  fetcher: GscFetcher = undiciFetcher
): Promise<GscSearchAnalyticsResult> {
  const endpoint = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  let response;
  try {
    response = await fetcher(endpoint, {
      method: 'POST',
      headers: { ...bearer(accessToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions,
        rowLimit: query.rowLimit,
        startRow: query.startRow,
      }),
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      status: 0,
      message: err instanceof Error ? err.message : 'Erreur réseau GSC',
    };
  }

  if (response.status >= 400) {
    return {
      ok: false,
      reason: classifyHttpError(response.status),
      status: response.status,
      message: `Erreur API GSC searchAnalytics (${response.status})`,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch {
    return { ok: false, reason: 'invalid_response', status: response.status, message: 'Réponse GSC non-JSON' };
  }

  const parsed = searchAnalyticsResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Shape de réponse GSC searchAnalytics inattendue',
    };
  }

  return { ok: true, rows: parsed.data.rows };
}
