import { describe, expect, it } from 'vitest';
import { parseHtml } from '@/lib/crawler/parse';

const BASE = 'https://example.com/';

describe('crawler/parse · meta SEO', () => {
  it('extrait title, description, canonical, H1 count', () => {
    const html = `
      <html><head>
        <title>  Mon Titre  </title>
        <meta name="description" content="Ma description SEO.">
        <link rel="canonical" href="https://example.com/canonical">
      </head><body>
        <h1>Heading 1</h1>
        <h1>Encore H1</h1>
        <h2>Heading 2</h2>
      </body></html>
    `;
    const r = parseHtml(html, BASE);
    expect(r.title).toBe('Mon Titre');
    expect(r.metaDescription).toBe('Ma description SEO.');
    expect(r.canonical).toBe('https://example.com/canonical');
    expect(r.h1Count).toBe(2);
  });

  it('retourne null sur title/description vide ou absente', () => {
    const html = `<html><head><title></title></head><body></body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.title).toBeNull();
    expect(r.metaDescription).toBeNull();
    expect(r.canonical).toBeNull();
    expect(r.h1Count).toBe(0);
  });
});

describe('crawler/parse · indexable', () => {
  it('default = indexable true, source null', () => {
    const r = parseHtml('<html><head></head><body></body></html>', BASE);
    expect(r.indexable).toBe(true);
    expect(r.noindexSource).toBeNull();
  });

  it('détecte meta robots noindex', () => {
    const html = `<html><head><meta name="robots" content="noindex, follow"></head><body></body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.indexable).toBe(false);
    expect(r.noindexSource).toBe('meta');
  });

  it("détecte X-Robots-Tag: noindex en header", () => {
    const r = parseHtml('<html><head></head><body></body></html>', BASE, {
      'x-robots-tag': 'noindex, nofollow',
    });
    expect(r.indexable).toBe(false);
    expect(r.noindexSource).toBe('header');
  });

  it('header noindex prime sur l\'absence de meta', () => {
    const r = parseHtml('<html><head></head><body></body></html>', BASE, {
      'X-Robots-Tag': 'noindex',
    });
    expect(r.indexable).toBe(false);
  });
});

describe('crawler/parse · JSON-LD', () => {
  it('parse un Organization simple', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Organization","name":"Acme"}
        </script>
      </head><body></body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.jsonLd).toHaveLength(1);
    expect(r.jsonLd[0]!.types).toEqual(['Organization']);
  });

  it("supporte @type en array et @graph imbriqué", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@graph":[
          {"@type":["Organization","Brand"],"name":"Acme"},
          {"@type":"SoftwareApplication","name":"App"}
        ]}
        </script>
      </head><body></body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.jsonLd).toHaveLength(1);
    expect(r.jsonLd[0]!.types).toEqual(
      expect.arrayContaining(['Organization', 'Brand', 'SoftwareApplication'])
    );
  });

  it('garde le raw même si JSON invalide', () => {
    const html = `<html><head><script type="application/ld+json">{ broken json</script></head><body></body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.jsonLd).toHaveLength(1);
    expect(r.jsonLd[0]!.parsed).toBeNull();
    expect(r.jsonLd[0]!.types).toEqual([]);
  });
});

describe('crawler/parse · internalLinks', () => {
  it('extrait, normalise et dédup les liens internes', () => {
    const html = `
      <html><body>
        <a href="/foo">a</a>
        <a href="/foo/">b</a>
        <a href="/bar?z=1&a=2">c</a>
        <a href="https://example.com/foo">d</a>
        <a href="#anchor">e</a>
        <a href="mailto:hi@a.com">f</a>
        <a href="https://other.com/page">g</a>
      </body></html>`;
    const r = parseHtml(html, BASE);
    expect(r.internalLinks).toEqual(
      expect.arrayContaining(['https://example.com/foo', 'https://example.com/bar?a=2&z=1'])
    );
    // Pas de cross-origin, pas de mailto, pas de hash-only
    expect(r.internalLinks.some((l) => l.includes('other.com'))).toBe(false);
    expect(r.internalLinks.some((l) => l.startsWith('mailto:'))).toBe(false);
    // Dédup: /foo et /foo/ → même URL normalisée
    expect(r.internalLinks.filter((l) => l === 'https://example.com/foo')).toHaveLength(1);
  });

  it('résout les liens relatifs depuis pageUrl', () => {
    const html = `<html><body><a href="../up">x</a></body></html>`;
    const r = parseHtml(html, 'https://example.com/sub/page');
    expect(r.internalLinks).toContain('https://example.com/up');
  });
});
