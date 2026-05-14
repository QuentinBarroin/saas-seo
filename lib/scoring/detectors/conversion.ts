import type { CrawlResult, CrawledPage } from '@/lib/crawler/types';
import { buildFinding, type FindingDraft } from '../finding';
import { SENSITIVE_URL_PATTERN } from '../url-patterns';

export type ConversionDetectorOptions = Record<string, never>;

/**
 * Applique les règles conversion-based (CONV-*) au CrawlResult.
 * En MVP : uniquement CONV-missing-cta.
 */
export function detectConversion(
  crawl: CrawlResult,
  _opts: ConversionDetectorOptions = {}
): FindingDraft[] {
  const findings: FindingDraft[] = [];

  for (const page of crawl.pages) {
    findings.push(...detectPageConversion(page));
  }

  return findings;
}

function detectPageConversion(page: CrawledPage): FindingDraft[] {
  const out: FindingDraft[] = [];

  if (page.statusCode !== 200) return out;
  if (!page.parsed) return out;
  if (!page.parsed.indexable) return out;
  if (SENSITIVE_URL_PATTERN.test(page.url)) return out;

  const { ctaLinks, ctaButtons, contactForms } = page.parsed.ctaSignals;
  const total = ctaLinks + ctaButtons + contactForms;
  if (total === 0) {
    out.push(buildFinding('CONV-missing-cta', { url: page.url }));
  }

  return out;
}
