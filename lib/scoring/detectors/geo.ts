import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';
import { buildFinding, type FindingDraft } from '../finding';

export type GeoDetectorOptions = {
  /** Type de projet (saas, blog, etc.) — pilote la pertinence de SoftwareApplication. */
  projectType?: string;
  /** Prédicat custom pour identifier la home (default : pathname === '/' ou ''). */
  isHomePage?: (url: string) => boolean;
};

function defaultIsHome(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname === '/' || u.pathname === '';
  } catch {
    return false;
  }
}

function jsonLdTypesOf(page: CrawledPage): Set<string> {
  const out = new Set<string>();
  if (!page.parsed) return out;
  for (const block of page.parsed.jsonLd) {
    for (const t of block.types) out.add(t);
  }
  return out;
}

export function detectGeo(crawl: CrawlResult, opts: GeoDetectorOptions = {}): FindingDraft[] {
  const findings: FindingDraft[] = [];
  const isHome = opts.isHomePage ?? defaultIsHome;

  // Construit l'agrégat des @type vus sur tout le site (utile pour SoftwareApplication).
  const allTypes = new Set<string>();
  let homePage: CrawledPage | null = null;
  for (const page of crawl.pages) {
    if (page.parsed === null) continue;
    if (isHome(page.url) && homePage === null) homePage = page;
    for (const t of jsonLdTypesOf(page)) allTypes.add(t);
  }

  // GEO-missing-organization-jsonld : on regarde sur la home, ou à défaut sur tout le site.
  const seenOrganization = homePage
    ? jsonLdTypesOf(homePage).has('Organization')
    : allTypes.has('Organization');
  if (!seenOrganization && crawl.pages.some((p) => p.parsed !== null)) {
    findings.push(
      buildFinding('GEO-missing-organization-jsonld', {
        url: homePage?.url ?? crawl.pages.find((p) => p.parsed)?.url ?? '',
      })
    );
  }

  // GEO-missing-softwareapplication-jsonld : seulement pour les projets de type "saas".
  if (opts.projectType === 'saas' && !allTypes.has('SoftwareApplication')) {
    findings.push(
      buildFinding('GEO-missing-softwareapplication-jsonld', {
        url: homePage?.url ?? '',
      })
    );
  }

  return findings;
}
