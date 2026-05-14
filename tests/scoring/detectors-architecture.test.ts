import { describe, expect, it } from 'vitest';
import { detectArchitecture } from '@/lib/scoring/detectors/architecture';
import { parseHtml } from '@/lib/crawler/parse';
import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';

const ORIGIN = 'https://example.com';
const NOW = new Date();

function page(url: string, html: string, statusCode = 200): CrawledPage {
  return {
    url,
    finalUrl: url,
    statusCode,
    fetchedAt: NOW,
    contentType: 'text/html',
    parsed: statusCode === 200 ? parseHtml(html, url) : null,
  };
}

function crawl(pages: CrawledPage[]): CrawlResult {
  return {
    pages,
    startedAt: NOW,
    finishedAt: NOW,
    skippedByRobots: [],
    sitemap: { url: `${ORIGIN}/sitemap.xml`, status: 200 },
    robots: { url: `${ORIGIN}/robots.txt`, status: 200 },
  };
}

describe('detectors/architecture · ARCH-orphan-page', () => {
  it('pas de pages - 0 finding', () => {
    const findings = detectArchitecture(crawl([]));
    expect(findings).toHaveLength(0);
  });

  it('1 seule page (la home) - 0 finding (cas degenere)', () => {
    const html = `<html><body><h1>Home</h1><a href="/">Self link</a></body></html>`;
    const findings = detectArchitecture(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings).toHaveLength(0);
  });

  it('2 pages avec liens reciproques - 0 finding', () => {
    const homeHtml = `<html><body><h1>Home</h1><a href="/about">About</a></body></html>`;
    const aboutHtml = `<html><body><h1>About</h1><a href="/">Home</a></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/about`, aboutHtml)])
    );
    expect(findings).toHaveLength(0);
  });

  it('2 pages, la 2e pas liee depuis la 1ere - 1 finding sur la 2e', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const orphanHtml = `<html><body><h1>Orphan</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/orphan`, orphanHtml)])
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe('ARCH-orphan-page');
    expect(findings[0]!.evidence.url).toBe(`${ORIGIN}/orphan`);
  });

  it('3 pages : home + page A (linkee depuis home) + page B (jamais linkee) - 1 finding sur B uniquement', () => {
    const homeHtml = `<html><body><h1>Home</h1><a href="/page-a">A</a></body></html>`;
    const pageAHtml = `<html><body><h1>Page A</h1><a href="/">Home</a></body></html>`;
    const pageBHtml = `<html><body><h1>Page B</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([
        page(`${ORIGIN}/`, homeHtml),
        page(`${ORIGIN}/page-a`, pageAHtml),
        page(`${ORIGIN}/page-b`, pageBHtml),
      ])
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe('ARCH-orphan-page');
    expect(findings[0]!.evidence.url).toBe(`${ORIGIN}/page-b`);
  });

  it('self-loop : page A lie vers elle-meme uniquement - 1 finding (self-link ne compte pas)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const selfLoopHtml = `<html><body><h1>Self Loop</h1><a href="/self">Self</a></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/self`, selfLoopHtml)])
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe('ARCH-orphan-page');
    expect(findings[0]!.evidence.url).toBe(`${ORIGIN}/self`);
  });

  it('page non-indexable orpheline - 0 finding (skip)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const noindexHtml = `<html><head><meta name="robots" content="noindex"></head><body><h1>Private</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/private`, noindexHtml)])
    );
    expect(findings).toHaveLength(0);
  });

  it('page status 500 - 0 finding (skip)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const brokenHtml = `<html><body><h1>500</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/broken`, brokenHtml, 500)])
    );
    expect(findings).toHaveLength(0);
  });

  it('URL sensible (token) orpheline - 0 finding (skip)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const tokenHtml = `<html><body><h1>Token</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([
        page(`${ORIGIN}/`, homeHtml),
        page(`${ORIGIN}/share/abcdefghijklmnopqrstuvwxyz1234`, tokenHtml),
      ])
    );
    expect(findings).toHaveLength(0);
  });

  it('URL admin orpheline - 0 finding (skip)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const adminHtml = `<html><body><h1>Admin</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/admin/dashboard`, adminHtml)])
    );
    expect(findings).toHaveLength(0);
  });

  it('home est toujours exclue du detecteur orphelin (meme si 0 incoming link)', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const pageHtml = `<html><body><h1>Page</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([page(`${ORIGIN}/`, homeHtml), page(`${ORIGIN}/page`, pageHtml)])
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.evidence.url).toBe(`${ORIGIN}/page`);
  });

  it('plusieurs pages orphelines - toutes detectees', () => {
    const homeHtml = `<html><body><h1>Home</h1></body></html>`;
    const orphan1Html = `<html><body><h1>Orphan1</h1></body></html>`;
    const orphan2Html = `<html><body><h1>Orphan2</h1></body></html>`;
    const findings = detectArchitecture(
      crawl([
        page(`${ORIGIN}/`, homeHtml),
        page(`${ORIGIN}/orphan1`, orphan1Html),
        page(`${ORIGIN}/orphan2`, orphan2Html),
      ])
    );
    expect(findings).toHaveLength(2);
    const urls = findings.map((f) => f.evidence.url);
    expect(urls).toContain(`${ORIGIN}/orphan1`);
    expect(urls).toContain(`${ORIGIN}/orphan2`);
  });

  it('page ayant 2+ liens entrants - 0 finding', () => {
    const homeHtml = `<html><body><h1>Home</h1><a href="/popular">Popular</a></body></html>`;
    const page2Html = `<html><body><h1>Page2</h1><a href="/popular">Popular</a></body></html>`;
    const popularHtml = `<html><body><h1>Popular</h1><a href="/">Home</a></body></html>`;
    const findings = detectArchitecture(
      crawl([
        page(`${ORIGIN}/`, homeHtml),
        page(`${ORIGIN}/page2`, page2Html),
        page(`${ORIGIN}/popular`, popularHtml),
      ])
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.evidence.url).toBe(`${ORIGIN}/page2`);
  });
});
