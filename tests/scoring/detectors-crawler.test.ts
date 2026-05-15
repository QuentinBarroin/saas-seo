import { describe, expect, it } from 'vitest';
import { detectFromCrawl } from '@/lib/scoring/detectors/crawler';
import { parseHtml } from '@/lib/crawler/parse';
import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';

const ORIGIN = 'https://example.com';
const NOW = new Date();

function mkPage(url: string, html: string, headers?: Record<string, string>): CrawledPage {
  const parsed = parseHtml(html, url, headers);
  return {
    url,
    finalUrl: url,
    statusCode: 200,
    fetchedAt: NOW,
    contentType: 'text/html',
    parsed,
  };
}

function mkBrokenPage(url: string, status: number): CrawledPage {
  return {
    url,
    finalUrl: url,
    statusCode: status,
    fetchedAt: NOW,
    contentType: null,
    parsed: null,
    error: `HTTP ${status}`,
  };
}

function mkCrawl(
  pages: CrawledPage[],
  sitemapStatus: number | null = 200,
  robotsStatus: number | null = 200
): CrawlResult {
  return {
    pages,
    startedAt: NOW,
    finishedAt: NOW,
    skippedByRobots: [],
    sitemap: { url: `${ORIGIN}/sitemap.xml`, status: sitemapStatus },
    robots: { url: `${ORIGIN}/robots.txt`, status: robotsStatus },
  };
}

const FULL_HTML = `
  <html><head>
    <title>Mon Titre</title>
    <meta name="description" content="Description SEO complète et lisible.">
    <link rel="canonical" href="${ORIGIN}/">
  </head><body><h1>Heading 1</h1></body></html>
`;

describe('detectors/crawler · page sans problème → 0 findings page-level', () => {
  it('page complète + sitemap + robots OK → 0 finding', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/`, FULL_HTML)]);
    expect(detectFromCrawl(crawl)).toHaveLength(0);
  });
});

describe('detectors/crawler · TECH-broken-status', () => {
  it('détecte une 404 et n\'émet pas les autres findings page-level', () => {
    const crawl = mkCrawl([mkBrokenPage(`${ORIGIN}/old`, 404)]);
    const findings = detectFromCrawl(crawl);
    const ids = findings.map((f) => f.ruleId);
    expect(ids).toContain('TECH-broken-status');
    expect(ids.filter((id) => id !== 'TECH-broken-status').every((id) => id.startsWith('TECH-missing-') === false)).toBe(true);
  });

  it('redirect (301/308) ne déclenche PAS broken-status', () => {
    const crawl = mkCrawl([mkBrokenPage(`${ORIGIN}/redirected`, 301)]);
    const ids = detectFromCrawl(crawl).map((f) => f.ruleId);
    expect(ids).not.toContain('TECH-broken-status');
  });

  it('304 Not Modified ne déclenche PAS broken-status (réponse de cache normale)', () => {
    const crawl = mkCrawl([mkBrokenPage(`${ORIGIN}/cached`, 304)]);
    const ids = detectFromCrawl(crawl).map((f) => f.ruleId);
    expect(ids).not.toContain('TECH-broken-status');
  });

  it('détecte une 500 (5xx)', () => {
    const crawl = mkCrawl([mkBrokenPage(`${ORIGIN}/boom`, 500)]);
    const ids = detectFromCrawl(crawl).map((f) => f.ruleId);
    expect(ids).toContain('TECH-broken-status');
  });
});

describe('detectors/crawler · TECH-missing-title/description/h1/canonical', () => {
  it('page minimale → 4 findings (title, desc, h1, canonical)', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/p`, '<html><head></head><body></body></html>')]);
    const ids = detectFromCrawl(crawl).map((f) => f.ruleId);
    expect(ids).toContain('TECH-missing-title');
    expect(ids).toContain('TECH-missing-description');
    expect(ids).toContain('TECH-missing-h1');
    expect(ids).toContain('TECH-missing-canonical');
  });

  it('H1 multiple → TECH-missing-h1 avec evidence.h1Count', () => {
    const html = '<html><head><title>T</title><meta name="description" content="d"><link rel="canonical" href="/"></head><body><h1>a</h1><h1>b</h1></body></html>';
    const findings = detectFromCrawl(mkCrawl([mkPage(`${ORIGIN}/`, html)]));
    const h1Finding = findings.find((f) => f.ruleId === 'TECH-missing-h1');
    expect(h1Finding).toBeDefined();
    expect(h1Finding!.evidence.h1Count).toBe(2);
  });
});

describe('detectors/crawler · TECH-noindex-on-public-page', () => {
  it("détecte noindex sur une route marketing", () => {
    const html = `${FULL_HTML.replace('<title>', '<meta name="robots" content="noindex"><title>')}`;
    const findings = detectFromCrawl(mkCrawl([mkPage(`${ORIGIN}/pricing`, html)]));
    const f = findings.find((x) => x.ruleId === 'TECH-noindex-on-public-page');
    expect(f).toBeDefined();
    expect(f!.evidence.source).toBe('meta');
  });

  it('skip si la route matche un privateRoutePatterns fourni', () => {
    const html = FULL_HTML.replace('<title>', '<meta name="robots" content="noindex"><title>');
    const findings = detectFromCrawl(mkCrawl([mkPage(`${ORIGIN}/dashboard`, html)]));
    // pas de pattern fourni → finding émis
    expect(findings.some((f) => f.ruleId === 'TECH-noindex-on-public-page')).toBe(true);

    const findings2 = detectFromCrawl(mkCrawl([mkPage(`${ORIGIN}/dashboard`, html)]), {
      privateRoutePatterns: [/\/dashboard/],
    });
    expect(findings2.some((f) => f.ruleId === 'TECH-noindex-on-public-page')).toBe(false);
  });
});

describe('detectors/crawler · TECH-private-page-indexable', () => {
  it('URL avec /admin et indexable=true → finding', () => {
    const findings = detectFromCrawl(mkCrawl([mkPage(`${ORIGIN}/admin/users`, FULL_HTML)]));
    const f = findings.find((x) => x.ruleId === 'TECH-private-page-indexable');
    expect(f).toBeDefined();
    expect(String(f!.evidence.pattern).toLowerCase()).toContain('admin');
  });

  it.each([
    `${ORIGIN}/share/abcdefghij1234567890ABCDEF`, // prefix /share/
    `${ORIGIN}/invite/xyz`, // prefix /invite/
    `${ORIGIN}/r/abcdefghijklmnopqrstuvwx`, // alphanumérique ≥ 24 sans dashes
    `${ORIGIN}/profil/550e8400-e29b-41d4-a716-446655440000`, // UUID v4
  ])('URL avec token réel → finding · %s', (url) => {
    expect(
      detectFromCrawl(mkCrawl([mkPage(url, FULL_HTML)])).some(
        (f) => f.ruleId === 'TECH-private-page-indexable'
      )
    ).toBe(true);
  });

  it.each([
    `${ORIGIN}/pricing`,
    // Régression novera-talent.com : slugs SEO légitimes ne doivent PAS être flaggés
    `${ORIGIN}/articles/comment-recruter-un-product-manager-senior`,
    `${ORIGIN}/missions/freelance-data-scientist-remote-2026`,
    `${ORIGIN}/entreprises/onboarding-developpeur-fullstack`,
    `${ORIGIN}/profil/marie-dupont`, // slug court avec dash
  ])('URL slug SEO légitime → PAS de finding · %s', (url) => {
    expect(
      detectFromCrawl(mkCrawl([mkPage(url, FULL_HTML)])).some(
        (f) => f.ruleId === 'TECH-private-page-indexable'
      )
    ).toBe(false);
  });
});

describe('detectors/crawler · site files (sitemap / robots)', () => {
  it('sitemap.xml en 404 → TECH-missing-sitemap', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/`, FULL_HTML)], 404, 200);
    const findings = detectFromCrawl(crawl);
    const f = findings.find((x) => x.ruleId === 'TECH-missing-sitemap');
    expect(f).toBeDefined();
    expect(f!.evidence.statusCode).toBe(404);
    expect(f!.evidence.url).toBe(ORIGIN);
  });

  it('robots.txt absent (status null) → TECH-missing-robots', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/`, FULL_HTML)], 200, null);
    expect(detectFromCrawl(crawl).some((f) => f.ruleId === 'TECH-missing-robots')).toBe(true);
  });

  it('sitemap et robots en 200 → 0 finding site-level', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/`, FULL_HTML)], 200, 200);
    const ids = detectFromCrawl(crawl).map((f) => f.ruleId);
    expect(ids).not.toContain('TECH-missing-sitemap');
    expect(ids).not.toContain('TECH-missing-robots');
  });
});

describe('detectors/crawler · findings shape', () => {
  it('chaque finding a category/severity/title/description/recommendation conformes à la règle', () => {
    const crawl = mkCrawl([mkPage(`${ORIGIN}/p`, '<html><head></head><body></body></html>')]);
    const findings = detectFromCrawl(crawl);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.severity).toMatch(/^(critical|high|medium|low)$/);
      expect(f.recommendation.length).toBeGreaterThan(20);
      expect(f.confidence).toBe('certain');
    }
  });

  it('renderTemplate substitue {url} dans la recommendation quand présent', () => {
    const crawl = mkCrawl([
      mkPage(`${ORIGIN}/p`, '<html><head><title>t</title><meta name="description" content="d"><link rel="canonical" href="/"></head><body><h1>h</h1></body></html>'),
    ]);
    // pas de finding ici puisque tout est OK ; on teste un finding minimal
    const empty = detectFromCrawl(crawl);
    expect(empty).toHaveLength(0);

    const crawl2 = mkCrawl([mkPage(`${ORIGIN}/p`, '<html><head><title>t</title><meta name="description" content="d"><link rel="canonical" href="/"></head><body></body></html>')]);
    const h1 = detectFromCrawl(crawl2).find((f) => f.ruleId === 'TECH-missing-h1');
    // recommendation doit contenir un signal pertinent, pas un placeholder brut comme "{url}"
    expect(h1!.recommendation).not.toContain('{url}');
  });
});
