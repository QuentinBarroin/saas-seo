import { z } from 'zod';
import { createDataForSeoClient, undiciFetcher } from './client';
import type { DataForSeoCredentials, DataForSeoEnvelope, Fetcher } from './types';

const serpOrganicItemSchema = z.object({
  type: z.literal('organic'),
  rank_absolute: z.number().optional(),
  rank_group: z.number().optional(),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
});

const serpPaaItemSchema = z.object({
  type: z.literal('people_also_ask'),
  items: z
    .array(z.object({ title: z.string() }))
    .optional()
    .catch([]),
  title: z.string().optional(),
});

const serpItemSchema = z.union([serpOrganicItemSchema, serpPaaItemSchema, z.object({ type: z.string() })]);

const serpLiveResultSchema = z.object({
  items: z.array(serpItemSchema).optional().catch([]),
});

export type FetchSerpLiveResult =
  | {
      ok: true;
      keyword: string;
      organic: Array<{
        rank: number;
        url: string;
        title?: string;
        snippet?: string;
        domain: string;
      }>;
      paa: string[];
      costUsd: number;
    }
  | {
      ok: false;
      reason: 'unauthorized' | 'network' | 'invalid_response' | 'api_error';
      status: number;
      message: string;
    };

export async function fetchSerpLive(
  creds: DataForSeoCredentials,
  params: { keyword: string; locationCode?: number; languageCode?: string },
  fetcher: Fetcher = undiciFetcher
): Promise<FetchSerpLiveResult> {
  const { keyword, locationCode = 2250, languageCode = 'fr' } = params;
  const client = createDataForSeoClient(creds, fetcher);

  let response;
  try {
    response = await client.post('/serp/google/organic/live/advanced', [
      {
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        depth: 10,
      },
    ]);
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      status: 0,
      message: err instanceof Error ? err.message : 'Erreur réseau',
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      reason: 'unauthorized',
      status: response.status,
      message: 'Identifiants DataForSEO invalides',
    };
  }

  if (response.status >= 500) {
    return {
      ok: false,
      reason: 'network',
      status: response.status,
      message: `Erreur serveur DataForSEO (${response.status})`,
    };
  }

  let envelope: DataForSeoEnvelope<unknown>;
  try {
    envelope = JSON.parse(response.body) as DataForSeoEnvelope<unknown>;
  } catch {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Réponse DataForSEO non-JSON',
    };
  }

  if (envelope.status_code >= 40100 && envelope.status_code < 40200) {
    return {
      ok: false,
      reason: 'unauthorized',
      status: response.status,
      message: envelope.status_message || 'Identifiants DataForSEO invalides',
    };
  }

  if (envelope.status_code !== 20000) {
    return {
      ok: false,
      reason: 'api_error',
      status: response.status,
      message: `${envelope.status_code}: ${envelope.status_message ?? 'erreur API'}`,
    };
  }

  const task = envelope.tasks?.[0];
  const resultRaw = task?.result?.[0];
  if (!resultRaw) {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Shape de réponse DataForSEO inattendue (result manquant)',
    };
  }

  const parsed = serpLiveResultSchema.safeParse(resultRaw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: 'invalid_response',
      status: response.status,
      message: 'Schema de réponse DataForSEO invalide',
    };
  }

  const items = parsed.data.items ?? [];
  const organic: Array<{ rank: number; url: string; title?: string; snippet?: string; domain: string }> =
    [];
  const paa: string[] = [];

  for (const item of items) {
    if (item.type === 'organic' && 'url' in item) {
      const rank = ('rank_absolute' in item ? item.rank_absolute : undefined) ??
                   ('rank_group' in item ? item.rank_group : undefined) ??
                   0;
      const domain = ('domain' in item && item.domain) ? item.domain : new URL(item.url).hostname;
      organic.push({
        rank,
        url: item.url,
        title: 'title' in item ? item.title : undefined,
        snippet: 'description' in item ? item.description : undefined,
        domain,
      });
    } else if (item.type === 'people_also_ask') {
      if ('items' in item && item.items && item.items.length > 0) {
        paa.push(...item.items.map((q: { title: string }) => q.title));
      } else if ('title' in item && item.title) {
        paa.push(item.title);
      }
    }
  }

  const top10 = organic
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10);

  return {
    ok: true,
    keyword,
    organic: top10,
    paa,
    costUsd: envelope.cost ?? 0,
  };
}
