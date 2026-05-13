import { describe, expect, it } from 'vitest';
import { crawl } from '@/lib/crawler';
import type { FetchResponse, Fetcher } from '@/lib/crawler/types';

function pageHtml(opts: { title?: string; links?: string[]; noindex?: boolean } = {}) {
  const meta = opts.noindex ? '<meta name="robots" content="noindex">' : '';
  const links = (opts.links ?? []).map((href) => `<a href="${href}">x</a>`).join('');
  return `<html><head><title>${opts.title ?? ''}</title>${meta}</head><body><h1>H1</h1>${links}</body></html>`;
}

function fakeFetcher(routes: Record<string, FetchResponse>): Fetcher {
  return async (url) => {
    const res = routes[url];
    if (!res) {
      return {
        status: 404,
        headers: { 'content-type': 'text/html' },
        body: '',
        finalUrl: url,
      };
    }
    return res;
  };
}

const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8' };
const ORIGIN = 'https://example.com';

describe('crawler · orchestrateur', () => {
  it('refuse une seed SSRF (private host) — retourne 0 pages', async () => {
    const res = await crawl({
      domain: 'http://localhost/',
      respectRobots: false,
      fetcher: async () => ({ status: 200, headers: {}, body: '', finalUrl: '' }),
    });
    expect(res.pages).toHaveLength(0);
  });

  it('crawl BFS, suit les liens internes, respecte maxPages', async () => {
    const fetcher = fakeFetcher({
      [`${ORIGIN}/`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ title: 'Home', links: ['/a', '/b', '/c'] }),
        finalUrl: `${ORIGIN}/`,
      },
      [`${ORIGIN}/a`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ title: 'A', links: ['/d'] }),
        finalUrl: `${ORIGIN}/a`,
      },
      [`${ORIGIN}/b`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ title: 'B' }),
        finalUrl: `${ORIGIN}/b`,
      },
      [`${ORIGIN}/c`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ title: 'C' }),
        finalUrl: `${ORIGIN}/c`,
      },
      [`${ORIGIN}/d`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ title: 'D' }),
        finalUrl: `${ORIGIN}/d`,
      },
    });

    const res = await crawl({
      domain: `${ORIGIN}/`,
      respectRobots: false,
      maxPages: 3,
      rateLimitMs: 0,
      fetcher,
    });

    expect(res.pages).toHaveLength(3);
    expect(res.pages[0]!.url).toBe(`${ORIGIN}/`);
  });

  it('respecte maxDepth (ne suit pas les liens au-delà)', async () => {
    const fetcher = fakeFetcher({
      [`${ORIGIN}/`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ links: ['/a'] }),
        finalUrl: `${ORIGIN}/`,
      },
      [`${ORIGIN}/a`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ links: ['/b'] }),
        finalUrl: `${ORIGIN}/a`,
      },
      [`${ORIGIN}/b`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ links: ['/c'] }),
        finalUrl: `${ORIGIN}/b`,
      },
      [`${ORIGIN}/c`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml(),
        finalUrl: `${ORIGIN}/c`,
      },
    });

    const res = await crawl({
      domain: `${ORIGIN}/`,
      respectRobots: false,
      maxDepth: 1,
      maxPages: 10,
      rateLimitMs: 0,
      fetcher,
    });
    const urls = res.pages.map((p) => p.url);
    expect(urls).toContain(`${ORIGIN}/`);
    expect(urls).toContain(`${ORIGIN}/a`);
    expect(urls).not.toContain(`${ORIGIN}/b`);
  });

  it('respecte robots.txt (skip les URL bloquées)', async () => {
    const fetcher = fakeFetcher({
      [`${ORIGIN}/`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ links: ['/public', '/admin/secret'] }),
        finalUrl: `${ORIGIN}/`,
      },
      [`${ORIGIN}/public`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml(),
        finalUrl: `${ORIGIN}/public`,
      },
    });

    const res = await crawl({
      domain: `${ORIGIN}/`,
      respectRobots: true,
      maxPages: 10,
      rateLimitMs: 0,
      fetcher,
      robotsLoader: async () => 'User-agent: *\nDisallow: /admin/',
    });

    const urls = res.pages.map((p) => p.url);
    expect(urls).toContain(`${ORIGIN}/public`);
    expect(urls).not.toContain(`${ORIGIN}/admin/secret`);
    expect(res.skippedByRobots).toContain(`${ORIGIN}/admin/secret`);
  });

  it('ignore les pages non-200 et non-HTML (pas de parsing)', async () => {
    const fetcher = fakeFetcher({
      [`${ORIGIN}/`]: {
        status: 200,
        headers: HTML_HEADERS,
        body: pageHtml({ links: ['/404', '/pdf'] }),
        finalUrl: `${ORIGIN}/`,
      },
      [`${ORIGIN}/404`]: {
        status: 404,
        headers: HTML_HEADERS,
        body: 'Not found',
        finalUrl: `${ORIGIN}/404`,
      },
      [`${ORIGIN}/pdf`]: {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        body: '%PDF...',
        finalUrl: `${ORIGIN}/pdf`,
      },
    });

    const res = await crawl({
      domain: `${ORIGIN}/`,
      respectRobots: false,
      maxPages: 10,
      rateLimitMs: 0,
      fetcher,
    });
    const byUrl = Object.fromEntries(res.pages.map((p) => [p.url, p]));
    expect(byUrl[`${ORIGIN}/404`]?.parsed).toBeNull();
    expect(byUrl[`${ORIGIN}/404`]?.error).toContain('HTTP 404');
    expect(byUrl[`${ORIGIN}/pdf`]?.parsed).toBeNull();
    expect(byUrl[`${ORIGIN}/pdf`]?.error).toContain('non-HTML');
  });
});
