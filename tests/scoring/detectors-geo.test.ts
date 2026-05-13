import { describe, expect, it } from 'vitest';
import { detectGeo } from '@/lib/scoring/detectors/geo';
import { parseHtml } from '@/lib/crawler/parse';
import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';

const ORIGIN = 'https://example.com';
const NOW = new Date();

function page(url: string, jsonLdTypes: string[] = []): CrawledPage {
  const scripts = jsonLdTypes
    .map(
      (t) =>
        `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': t,
          name: 'X',
        })}</script>`
    )
    .join('');
  const html = `<html><head>${scripts}</head><body></body></html>`;
  return {
    url,
    finalUrl: url,
    statusCode: 200,
    fetchedAt: NOW,
    contentType: 'text/html',
    parsed: parseHtml(html, url),
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

describe('detectors/geo · GEO-missing-organization-jsonld', () => {
  it('home sans JSON-LD Organization → finding', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/`)]));
    expect(findings.some((f) => f.ruleId === 'GEO-missing-organization-jsonld')).toBe(true);
  });

  it('home avec Organization → pas de finding', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/`, ['Organization'])]));
    expect(findings.some((f) => f.ruleId === 'GEO-missing-organization-jsonld')).toBe(false);
  });

  it('Organization présent ailleurs mais pas sur home → finding (home prime)', () => {
    const findings = detectGeo(
      crawl([page(`${ORIGIN}/`), page(`${ORIGIN}/about`, ['Organization'])])
    );
    expect(findings.some((f) => f.ruleId === 'GEO-missing-organization-jsonld')).toBe(true);
  });

  it('aucune home, mais Organization quelque part → pas de finding', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/about`, ['Organization'])]));
    expect(findings.some((f) => f.ruleId === 'GEO-missing-organization-jsonld')).toBe(false);
  });

  it('crawl vide → pas de finding (rien à dire)', () => {
    const findings = detectGeo(crawl([]));
    expect(findings).toHaveLength(0);
  });
});

describe('detectors/geo · GEO-missing-softwareapplication-jsonld', () => {
  it('projet saas sans SoftwareApplication nulle part → finding', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/`, ['Organization'])]), {
      projectType: 'saas',
    });
    expect(findings.some((f) => f.ruleId === 'GEO-missing-softwareapplication-jsonld')).toBe(true);
  });

  it('projet saas avec SoftwareApplication (sur une page produit) → pas de finding', () => {
    const findings = detectGeo(
      crawl([
        page(`${ORIGIN}/`, ['Organization']),
        page(`${ORIGIN}/produit`, ['SoftwareApplication']),
      ]),
      { projectType: 'saas' }
    );
    expect(findings.some((f) => f.ruleId === 'GEO-missing-softwareapplication-jsonld')).toBe(
      false
    );
  });

  it('projet non-saas (blog) → pas de finding même sans SoftwareApplication', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/`, ['Organization'])]), {
      projectType: 'blog',
    });
    expect(findings.some((f) => f.ruleId === 'GEO-missing-softwareapplication-jsonld')).toBe(
      false
    );
  });

  it('projet type non spécifié → SoftwareApplication non requis', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/`, ['Organization'])]));
    expect(findings.some((f) => f.ruleId === 'GEO-missing-softwareapplication-jsonld')).toBe(
      false
    );
  });
});

describe('detectors/geo · isHomePage custom', () => {
  it('utilise le prédicat custom (ex: /home)', () => {
    const findings = detectGeo(crawl([page(`${ORIGIN}/home`, ['Organization'])]), {
      isHomePage: (u) => new URL(u).pathname === '/home',
    });
    expect(findings.some((f) => f.ruleId === 'GEO-missing-organization-jsonld')).toBe(false);
  });
});
