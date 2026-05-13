import * as cheerio from 'cheerio';
import { isSameOrigin, normalizeUrl } from './safety';
import type { JsonLdBlock, ParsedPage } from './types';

/** Extrait toutes les méta-données SEO d'une page HTML. */
export function parseHtml(
  html: string,
  pageUrl: string,
  headers?: Record<string, string>
): ParsedPage {
  const $ = cheerio.load(html);

  const title = textOrNull($('head > title').first().text());
  const metaDescription = textOrNull($('head meta[name="description"]').attr('content'));
  const canonical = textOrNull($('head link[rel="canonical"]').attr('href'));
  const h1Count = $('body h1').length;

  const { indexable, source: noindexSource } = computeIndexable($, headers);
  const jsonLd = extractJsonLd($);
  const internalLinks = extractInternalLinks($, pageUrl);

  return {
    title,
    metaDescription,
    canonical,
    h1Count,
    indexable,
    noindexSource,
    jsonLd,
    internalLinks,
  };
}

function textOrNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function computeIndexable(
  $: cheerio.CheerioAPI,
  headers?: Record<string, string>
): { indexable: boolean; source: ParsedPage['noindexSource'] } {
  const headerRobots = headers
    ? Object.entries(headers).find(([k]) => k.toLowerCase() === 'x-robots-tag')?.[1]
    : undefined;
  if (headerRobots && /\bnoindex\b/i.test(headerRobots)) {
    return { indexable: false, source: 'header' };
  }

  const metaRobots = $('head meta[name="robots"]').attr('content') ?? '';
  if (/\bnoindex\b/i.test(metaRobots)) {
    return { indexable: false, source: 'meta' };
  }

  return { indexable: true, source: null };
}

function extractJsonLd($: cheerio.CheerioAPI): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON-LD invalide → on garde le raw, parsed = null, types = []
      blocks.push({ raw, parsed: null, types: [] });
      return;
    }
    blocks.push({ raw, parsed, types: collectTypes(parsed) });
  });
  return blocks;
}

function collectTypes(node: unknown): string[] {
  const out = new Set<string>();
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) {
      for (const item of n) visit(item);
      return;
    }
    if (n && typeof n === 'object') {
      const record = n as Record<string, unknown>;
      const t = record['@type'];
      if (typeof t === 'string') out.add(t);
      else if (Array.isArray(t)) for (const item of t) if (typeof item === 'string') out.add(item);
      // @graph imbriqué (cas courant Yoast/Rank Math)
      const graph = record['@graph'];
      if (Array.isArray(graph)) for (const item of graph) visit(item);
    }
  };
  visit(node);
  return Array.from(out);
}

function extractInternalLinks($: cheerio.CheerioAPI, pageUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(pageUrl);
  } catch {
    return [];
  }
  const out = new Set<string>();
  $('body a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }
    let target: URL;
    try {
      target = new URL(href, base);
    } catch {
      return;
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return;
    if (!isSameOrigin(base, target)) return;
    out.add(normalizeUrl(target));
  });
  return Array.from(out);
}
