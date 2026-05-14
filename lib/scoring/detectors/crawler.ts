import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';
import { buildFinding, type FindingDraft } from '../finding';
import { SENSITIVE_URL_PATTERN } from '../url-patterns';

const REDIRECT_CODES = new Set([301, 302, 307, 308]);

export type DetectorOptions = {
  /** Origine du site (utilisée pour TECH-noindex-on-public-page). */
  origin?: string;
  /** Routes considérées comme privées (skippées pour TECH-noindex-on-public-page). */
  privateRoutePatterns?: RegExp[];
};

/** Applique toutes les règles crawler-based (TECH-* + indexabilité) au CrawlResult. */
export function detectFromCrawl(crawl: CrawlResult, opts: DetectorOptions = {}): FindingDraft[] {
  const findings: FindingDraft[] = [];

  for (const page of crawl.pages) {
    findings.push(...detectPage(page, opts));
  }

  findings.push(...detectSiteFiles(crawl));

  return findings;
}

function detectPage(page: CrawledPage, opts: DetectorOptions): FindingDraft[] {
  const out: FindingDraft[] = [];

  // TECH-broken-status — status non 2xx/3xx
  if (page.statusCode !== 0 && page.statusCode !== 200 && !REDIRECT_CODES.has(page.statusCode)) {
    out.push(
      buildFinding('TECH-broken-status', {
        url: page.url,
        statusCode: page.statusCode,
      })
    );
    return out; // si la page est cassée, les autres détecteurs n'ont rien à dire
  }

  if (!page.parsed) return out;

  const { title, metaDescription, canonical, h1Count, indexable, noindexSource } = page.parsed;

  // TECH-missing-title
  if (title === null) {
    out.push(buildFinding('TECH-missing-title', { url: page.url }));
  }

  // TECH-missing-description
  if (metaDescription === null) {
    out.push(buildFinding('TECH-missing-description', { url: page.url }));
  }

  // TECH-missing-h1 — H1 absent ou multiple
  if (h1Count !== 1) {
    out.push(buildFinding('TECH-missing-h1', { url: page.url, h1Count }));
  }

  // TECH-missing-canonical
  if (canonical === null) {
    out.push(buildFinding('TECH-missing-canonical', { url: page.url }));
  }

  // TECH-noindex-on-public-page — indexable false ET URL pas dans une route privée connue
  if (!indexable) {
    const isPrivate = (opts.privateRoutePatterns ?? []).some((re) => re.test(page.url));
    if (!isPrivate) {
      out.push(
        buildFinding('TECH-noindex-on-public-page', {
          url: page.url,
          source: noindexSource ?? 'unknown',
        })
      );
    }
  }

  // TECH-private-page-indexable — URL matche un pattern sensible mais reste indexable
  if (indexable && SENSITIVE_URL_PATTERN.test(page.url)) {
    const match = page.url.match(SENSITIVE_URL_PATTERN);
    out.push(
      buildFinding('TECH-private-page-indexable', {
        url: page.url,
        pattern: match?.[0] ?? 'sensitive-url',
      })
    );
  }

  return out;
}

function detectSiteFiles(crawl: CrawlResult): FindingDraft[] {
  const out: FindingDraft[] = [];

  // TECH-missing-sitemap — non 200
  if (crawl.sitemap.url && crawl.sitemap.status !== 200) {
    out.push(
      buildFinding('TECH-missing-sitemap', {
        url: stripPath(crawl.sitemap.url),
        statusCode: crawl.sitemap.status ?? 0,
      })
    );
  }

  // TECH-missing-robots — non 200
  if (crawl.robots.url && crawl.robots.status !== 200) {
    out.push(
      buildFinding('TECH-missing-robots', {
        url: stripPath(crawl.robots.url),
        statusCode: crawl.robots.status ?? 0,
      })
    );
  }

  return out;
}

function stripPath(fullUrl: string): string {
  try {
    return new URL(fullUrl).origin;
  } catch {
    return fullUrl;
  }
}
