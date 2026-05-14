import { describe, expect, it } from 'vitest';
import { detectConversion } from '@/lib/scoring/detectors/conversion';
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

describe('detectors/conversion · CONV-missing-cta', () => {
  it('page avec <a href="/contact"> → ctaLinks=1, pas de finding', () => {
    const html = `<html><body><a href="/contact">Contact</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('page avec <button class="btn-primary">Démarrer</button> → ctaButtons=1, pas de finding', () => {
    const html = `<html><body><button class="btn-primary">Démarrer</button></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('page avec uniquement <a href="/about">À propos</a> → total=0, finding émis', () => {
    const html = `<html><body><a href="/about">À propos</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    const finding = findings.find((f) => f.ruleId === 'CONV-missing-cta');
    expect(finding).toBeDefined();
    expect(finding?.evidence.url).toBe(`${ORIGIN}/`);
  });

  it('page noindex → pas de finding (skip non-indexable)', () => {
    const html = `<html><head><meta name="robots" content="noindex"></head><body><a href="/about">About</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/private`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('page 404 → pas de finding', () => {
    const html = `<html><body><h1>404</h1></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/missing`, html, 404)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('mailto: link → ctaLinks=1', () => {
    const html = `<html><body><a href="mailto:hi@example.com">Email</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('tel: link → ctaLinks=1', () => {
    const html = `<html><body><a href="tel:+123456789">Call</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('lien vers /demo → ctaLinks=1', () => {
    const html = `<html><body><a href="/demo">Demo</a></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('form avec input email → contactForms=1', () => {
    const html = `<html><body><form><input type="email"><button type="submit">Envoyer</button></form></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('page sensible (URL token) sans CTA → pas de finding (skipped)', () => {
    const html = `<html><body><p>Contenu privé tokenisé</p></body></html>`;
    const findings = detectConversion(
      crawl([page(`${ORIGIN}/share/abcdefghijklmnopqrstuvwxyz1234`, html)])
    );
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('page admin sans CTA → pas de finding (skipped)', () => {
    const html = `<html><body><p>Panel admin</p></body></html>`;
    const findings = detectConversion(crawl([page(`${ORIGIN}/admin/dashboard`, html)]));
    expect(findings.some((f) => f.ruleId === 'CONV-missing-cta')).toBe(false);
  });

  it('crawl avec plusieurs pages : identifie celles sans CTA', () => {
    const htmlWithCta = `<html><body><a href="/contact">Contact</a></body></html>`;
    const htmlWithoutCta = `<html><body><p>Content</p></body></html>`;
    const findings = detectConversion(
      crawl([
        page(`${ORIGIN}/`, htmlWithCta),
        page(`${ORIGIN}/about`, htmlWithoutCta),
        page(`${ORIGIN}/services`, htmlWithCta),
      ])
    );
    const missingCta = findings.filter((f) => f.ruleId === 'CONV-missing-cta');
    expect(missingCta).toHaveLength(1);
    expect(missingCta[0]!.evidence.url).toBe(`${ORIGIN}/about`);
  });
});
