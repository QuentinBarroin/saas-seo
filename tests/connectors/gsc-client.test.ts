import { describe, expect, it } from 'vitest';
import {
  listSites,
  querySearchAnalytics,
  GSC_API_BASE,
  type GscFetcher,
} from '@/lib/connectors/gsc';

describe('gsc/client · listSites', () => {
  it('mappe les propriétés accessibles', async () => {
    let capturedUrl = '';
    let capturedAuth = '';
    const fetcher: GscFetcher = async (url, init) => {
      capturedUrl = url;
      capturedAuth = init.headers.authorization ?? '';
      return {
        status: 200,
        body: JSON.stringify({
          siteEntry: [
            { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
            { siteUrl: 'https://blog.example.com/', permissionLevel: 'siteFullUser' },
          ],
        }),
      };
    };

    const result = await listSites('ya29.token', fetcher);

    expect(capturedUrl).toBe(`${GSC_API_BASE}/sites`);
    expect(capturedAuth).toBe('Bearer ya29.token');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sites).toHaveLength(2);
      expect(result.sites[0]?.siteUrl).toBe('sc-domain:example.com');
    }
  });

  it('réponse sans siteEntry → liste vide', async () => {
    const fetcher: GscFetcher = async () => ({ status: 200, body: '{}' });
    const result = await listSites('t', fetcher);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.sites).toEqual([]);
  });

  it('401 → reason unauthorized', async () => {
    const fetcher: GscFetcher = async () => ({ status: 401, body: '{"error":{}}' });
    const result = await listSites('expired', fetcher);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('réponse non-JSON → reason invalid_response', async () => {
    const fetcher: GscFetcher = async () => ({ status: 200, body: 'not json' });
    const result = await listSites('t', fetcher);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_response');
  });
});

describe('gsc/client · querySearchAnalytics', () => {
  const query = {
    startDate: '2026-02-14',
    endDate: '2026-05-15',
    dimensions: ['date', 'query', 'page'],
    startRow: 0,
    rowLimit: 25_000,
  };

  it('encode siteUrl dans le path et envoie le body de requête', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    const fetcher: GscFetcher = async (url, init) => {
      capturedUrl = url;
      capturedBody = init.body ?? '';
      return {
        status: 200,
        body: JSON.stringify({
          rows: [{ keys: ['2026-05-10', 'audit seo', 'https://x/p'], clicks: 4, impressions: 90, ctr: 0.044, position: 7.1 }],
        }),
      };
    };

    const result = await querySearchAnalytics('ya29.t', 'sc-domain:example.com', query, fetcher);

    expect(capturedUrl).toBe(
      `${GSC_API_BASE}/sites/${encodeURIComponent('sc-domain:example.com')}/searchAnalytics/query`
    );
    const parsed = JSON.parse(capturedBody);
    expect(parsed.dimensions).toEqual(['date', 'query', 'page']);
    expect(parsed.startRow).toBe(0);
    expect(parsed.rowLimit).toBe(25_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.keys).toEqual(['2026-05-10', 'audit seo', 'https://x/p']);
      expect(result.rows[0]?.clicks).toBe(4);
    }
  });

  it('réponse sans rows → liste vide', async () => {
    const fetcher: GscFetcher = async () => ({ status: 200, body: '{}' });
    const result = await querySearchAnalytics('t', 'site', query, fetcher);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toEqual([]);
  });

  it('403 → reason unauthorized', async () => {
    const fetcher: GscFetcher = async () => ({ status: 403, body: '{}' });
    const result = await querySearchAnalytics('t', 'site', query, fetcher);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unauthorized');
  });

  it('erreur réseau → reason network', async () => {
    const fetcher: GscFetcher = async () => {
      throw new Error('socket hang up');
    };
    const result = await querySearchAnalytics('t', 'site', query, fetcher);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('network');
  });
});
