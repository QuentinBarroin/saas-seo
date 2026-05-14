import type { CrawlResult } from '@/lib/crawler/types';
import { buildFinding, type FindingDraft } from '../finding';
import { SENSITIVE_URL_PATTERN } from '../url-patterns';

export type ArchitectureDetectorOptions = Record<string, never>;

/**
 * Applique les règles architecture-based (ARCH-*) au CrawlResult.
 * En MVP : uniquement ARCH-orphan-page.
 */
export function detectArchitecture(
  crawl: CrawlResult,
  _opts: ArchitectureDetectorOptions = {}
): FindingDraft[] {
  const findings: FindingDraft[] = [];

  const indexablePages200 = crawl.pages.filter(
    (p) => p.statusCode === 200 && p.parsed && p.parsed.indexable
  );

  if (indexablePages200.length < 2) {
    return findings;
  }

  const incomingLinksByUrl = new Map<string, number>();

  for (const page of indexablePages200) {
    if (!page.parsed) continue;
    const sourceUrl = page.url;
    for (const target of page.parsed.internalLinks) {
      if (target === sourceUrl) continue;
      incomingLinksByUrl.set(target, (incomingLinksByUrl.get(target) ?? 0) + 1);
    }
  }

  const homeUrl = getHomeUrl(crawl);

  for (const page of indexablePages200) {
    if (isHomeUrl(page.url, homeUrl)) continue;
    if (SENSITIVE_URL_PATTERN.test(page.url)) continue;

    const incomingCount = incomingLinksByUrl.get(page.url) ?? 0;
    if (incomingCount === 0) {
      findings.push(buildFinding('ARCH-orphan-page', { url: page.url }));
    }
  }

  return findings;
}

function getHomeUrl(crawl: CrawlResult): string | null {
  const firstPage = crawl.pages[0];
  if (!firstPage) return null;
  try {
    const parsed = new URL(firstPage.url);
    return `${parsed.origin}/`;
  } catch {
    return null;
  }
}

function isHomeUrl(url: string, homeUrl: string | null): boolean {
  if (!homeUrl) return false;
  if (url === homeUrl) return true;
  const withoutSlash = homeUrl.replace(/\/$/, '');
  return url === withoutSlash;
}
