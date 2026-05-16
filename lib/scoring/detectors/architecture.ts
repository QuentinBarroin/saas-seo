import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';
import { normalizeUrl } from '@/lib/crawler/safety';
import { buildFinding, type FindingDraft } from '../finding';
import { SENSITIVE_URL_PATTERN } from '../url-patterns';

export type ArchitectureDetectorOptions = Record<string, never>;

/**
 * Applique les règles architecture-based (ARCH-*) au CrawlResult :
 * pages orphelines, liens internes vers des redirections, canonical
 * incohérente / cassée, doublons de title et de meta description.
 */
export function detectArchitecture(
  crawl: CrawlResult,
  _opts: ArchitectureDetectorOptions = {}
): FindingDraft[] {
  return [
    ...detectOrphanPages(crawl),
    ...detectInternalLinksToRedirect(crawl),
    ...detectCanonicalIssues(crawl),
    ...detectDuplicateMeta(crawl),
  ];
}

/** ARCH-orphan-page : page indexable 200 sans aucun lien interne entrant. */
function detectOrphanPages(crawl: CrawlResult): FindingDraft[] {
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

    if ((incomingLinksByUrl.get(page.url) ?? 0) === 0) {
      findings.push(buildFinding('ARCH-orphan-page', { url: page.url }));
    }
  }
  return findings;
}

/**
 * ARCH-internal-link-to-redirect : un lien interne pointe vers une URL
 * crawlée qui redirige (`url !== finalUrl`). Un finding par URL redirigée
 * ciblée, listant les pages sources.
 */
function detectInternalLinksToRedirect(crawl: CrawlResult): FindingDraft[] {
  const findings: FindingDraft[] = [];

  // URLs crawlées qui redirigent : un non-redirect a finalUrl === url exact.
  const redirectingTargets = new Map<string, string>();
  for (const page of crawl.pages) {
    if (page.url !== page.finalUrl) {
      redirectingTargets.set(page.url, page.finalUrl);
    }
  }
  if (redirectingTargets.size === 0) return findings;

  const sourcesByTarget = new Map<string, Set<string>>();
  for (const page of crawl.pages) {
    if (!page.parsed) continue;
    for (const link of page.parsed.internalLinks) {
      if (!redirectingTargets.has(link)) continue;
      if (link === page.url) continue;
      let sources = sourcesByTarget.get(link);
      if (!sources) {
        sources = new Set();
        sourcesByTarget.set(link, sources);
      }
      sources.add(page.url);
    }
  }

  for (const [targetUrl, finalUrl] of redirectingTargets) {
    const sources = sourcesByTarget.get(targetUrl);
    if (!sources || sources.size === 0) continue;
    const sourceUrls = Array.from(sources).sort();
    findings.push(
      buildFinding('ARCH-internal-link-to-redirect', {
        targetUrl,
        finalUrl,
        sourceUrls: sourceUrls.join(', '),
        linkCount: sourceUrls.length,
      })
    );
  }
  return findings;
}

/**
 * ARCH-canonical-mismatch / ARCH-canonical-target-invalid : analyse la balise
 * canonical de chaque page 200. Une cible cassée prime sur un simple mismatch
 * (un seul finding par page).
 */
function detectCanonicalIssues(crawl: CrawlResult): FindingDraft[] {
  const findings: FindingDraft[] = [];

  const pageByUrl = new Map<string, CrawledPage>();
  for (const page of crawl.pages) {
    pageByUrl.set(page.url, page);
    const finalNormalized = safeNormalize(page.finalUrl);
    if (finalNormalized) pageByUrl.set(finalNormalized, page);
  }

  for (const page of crawl.pages) {
    if (page.statusCode !== 200 || !page.parsed) continue;
    const rawCanonical = page.parsed.canonical;
    if (!rawCanonical) continue;

    // La canonical est l'attribut href brut : résolu contre l'URL de la page.
    const canonicalUrl = safeNormalize(rawCanonical, page.finalUrl);
    if (!canonicalUrl) continue;

    const target = pageByUrl.get(canonicalUrl);
    if (
      target &&
      (target.statusCode !== 200 ||
        (target.parsed !== null && !target.parsed.indexable))
    ) {
      findings.push(
        buildFinding('ARCH-canonical-target-invalid', {
          url: page.url,
          canonical: rawCanonical,
          targetStatus: target.statusCode,
        })
      );
      continue;
    }

    const selfUrl = safeNormalize(page.finalUrl);
    if (page.parsed.indexable && selfUrl && canonicalUrl !== selfUrl) {
      findings.push(
        buildFinding('ARCH-canonical-mismatch', {
          url: page.url,
          canonical: rawCanonical,
        })
      );
    }
  }
  return findings;
}

/**
 * ARCH-duplicate-title / ARCH-duplicate-description : regroupe les pages
 * indexables 200 par title puis par meta description. Un finding par groupe
 * de doublons (≥ 2 pages).
 */
function detectDuplicateMeta(crawl: CrawlResult): FindingDraft[] {
  const findings: FindingDraft[] = [];

  const indexablePages200 = crawl.pages.filter(
    (p) => p.statusCode === 200 && p.parsed && p.parsed.indexable
  );

  const urlsByTitle = new Map<string, string[]>();
  const urlsByDescription = new Map<string, string[]>();
  for (const page of indexablePages200) {
    if (!page.parsed) continue;
    const { title, metaDescription } = page.parsed;
    if (title) {
      urlsByTitle.set(title, [...(urlsByTitle.get(title) ?? []), page.url]);
    }
    if (metaDescription) {
      urlsByDescription.set(metaDescription, [
        ...(urlsByDescription.get(metaDescription) ?? []),
        page.url,
      ]);
    }
  }

  for (const [title, urls] of urlsByTitle) {
    if (urls.length < 2) continue;
    findings.push(
      buildFinding('ARCH-duplicate-title', {
        title,
        urls: [...urls].sort().join(', '),
        count: urls.length,
      })
    );
  }
  for (const urls of urlsByDescription.values()) {
    if (urls.length < 2) continue;
    findings.push(
      buildFinding('ARCH-duplicate-description', {
        urls: [...urls].sort().join(', '),
        count: urls.length,
      })
    );
  }
  return findings;
}

/** Normalise une URL pour comparaison ; null si l'URL est invalide. */
function safeNormalize(input: string, base?: string): string | null {
  try {
    return normalizeUrl(base ? new URL(input, base) : new URL(input));
  } catch {
    return null;
  }
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
