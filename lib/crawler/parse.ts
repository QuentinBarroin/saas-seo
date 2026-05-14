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
  const ctaSignals = extractCtaSignals($, pageUrl);

  return {
    title,
    metaDescription,
    canonical,
    h1Count,
    indexable,
    noindexSource,
    jsonLd,
    internalLinks,
    ctaSignals,
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

/**
 * Détecte les signaux CTA (Call To Action) sur la page avec compteurs traçables.
 *
 * Heuristiques (du plus fort au plus faible) :
 * 1. ctaLinks : `<a href>` matching `mailto:|tel:` OU path matching pattern CTA
 * 2. ctaButtons : `<a>` ou `<button>` avec class matching pattern CTA
 * 3. contactForms : `<form>` contenant `input[type="email"]` OU `input[name*="email"]` OU `textarea`
 */
function extractCtaSignals($: cheerio.CheerioAPI, pageUrl: string): ParsedPage['ctaSignals'] {
  const CTA_PATH_RE =
    /(contact|demo|démo|signup|register|inscri|essai|trial|book|devis|quote|start|onboard|nous-contacter|join|rejoindre|reserver|réserver|appel)/i;
  const CTA_PROTOCOL_RE = /^(?:mailto:|tel:)/i;
  const CTA_CLASS_RE = /\b(cta|btn-primary|button-primary|primary-btn|nv-button|bg-primary)\b/i;

  let ctaLinks = 0;
  let ctaButtons = 0;
  let contactForms = 0;

  let base: URL;
  try {
    base = new URL(pageUrl);
  } catch {
    return { ctaLinks: 0, ctaButtons: 0, contactForms: 0 };
  }

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    if (CTA_PROTOCOL_RE.test(href)) {
      ctaLinks++;
      return;
    }

    let target: URL;
    try {
      target = new URL(href, base);
    } catch {
      return;
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') return;

    if (CTA_PATH_RE.test(target.pathname)) {
      ctaLinks++;
    }
  });

  $('a[class], button[class]').each((_, el) => {
    const classes = $(el).attr('class') ?? '';
    if (CTA_CLASS_RE.test(classes)) {
      ctaButtons++;
    }
  });

  $('form').each((_, form) => {
    const $form = $(form);
    const hasEmailInput = $form.find('input[type="email"]').length > 0;
    const hasEmailNameInput =
      $form.find('input').filter((_, inp) => {
        const name = $(inp).attr('name') ?? '';
        return /email/i.test(name);
      }).length > 0;
    const hasTextarea = $form.find('textarea').length > 0;

    if (hasEmailInput || hasEmailNameInput || hasTextarea) {
      contactForms++;
    }
  });

  return { ctaLinks, ctaButtons, contactForms };
}
