import { describe, expect, it } from 'vitest';
import {
  countJsxTags,
  hasJsonLdInjection,
  hasMetadataExport,
  hasUnoptimizedImagesInNextConfig,
  hasUseClientDirective,
  parseSourceFile,
} from '@/lib/repo-scan/ast';

describe('repo-scan/ast · hasUseClientDirective', () => {
  it('détecte "use client" en première position', () => {
    const sf = parseSourceFile('a.tsx', `"use client";\nexport default function P() { return null }`);
    expect(hasUseClientDirective(sf)).toBe(true);
  });

  it("accepte 'use client' (single quotes)", () => {
    const sf = parseSourceFile('b.tsx', `'use client';\nexport default function P() { return null }`);
    expect(hasUseClientDirective(sf)).toBe(true);
  });

  it("retourne false si la directive est en 2e position (pas reconnue par Next.js)", () => {
    const sf = parseSourceFile(
      'c.tsx',
      `import { useState } from 'react';\n'use client';\nexport default function P() { return null }`
    );
    expect(hasUseClientDirective(sf)).toBe(false);
  });

  it('retourne false sur un Server Component standard', () => {
    const sf = parseSourceFile('d.tsx', `export default function P() { return <div /> }`);
    expect(hasUseClientDirective(sf)).toBe(false);
  });
});

describe('repo-scan/ast · hasMetadataExport', () => {
  it("détecte un `export const metadata = {...}`", () => {
    const sf = parseSourceFile(
      'e.tsx',
      `export const metadata = { title: 'X' };\nexport default function P() { return null }`
    );
    const r = hasMetadataExport(sf);
    expect(r.metadata).toBe(true);
    expect(r.generateMetadata).toBe(false);
  });

  it("détecte `export async function generateMetadata` même quand metadata absent", () => {
    const sf = parseSourceFile(
      'f.tsx',
      `export async function generateMetadata() { return { title: 'X' } }\nexport default function P() { return null }`
    );
    const r = hasMetadataExport(sf);
    expect(r.metadata).toBe(false);
    expect(r.generateMetadata).toBe(true);
  });

  it("retourne false si aucun export metadata", () => {
    const sf = parseSourceFile('g.tsx', `export default function P() { return <div /> }`);
    const r = hasMetadataExport(sf);
    expect(r.metadata).toBe(false);
    expect(r.generateMetadata).toBe(false);
  });

  it("ne se laisse pas berner par une variable locale `metadata`", () => {
    const sf = parseSourceFile(
      'h.tsx',
      `function P() { const metadata = { title: 'x' }; return null }`
    );
    const r = hasMetadataExport(sf);
    expect(r.metadata).toBe(false);
  });
});

describe('repo-scan/ast · countJsxTags', () => {
  it('compte les tags JSX (self-closing et avec children)', () => {
    const sf = parseSourceFile(
      'i.tsx',
      `export default function P() { return <main><img src="a"/><img src="b"/><span>x</span></main> }`
    );
    expect(countJsxTags(sf, 'img')).toBe(2);
    expect(countJsxTags(sf, 'span')).toBe(1);
    expect(countJsxTags(sf, 'main')).toBe(1);
    expect(countJsxTags(sf, 'div')).toBe(0);
  });
});

describe('repo-scan/ast · hasJsonLdInjection', () => {
  it("détecte un <script type=\"application/ld+json\">", () => {
    const sf = parseSourceFile(
      'j.tsx',
      `export default function P() { return <script type="application/ld+json">{}</script> }`
    );
    expect(hasJsonLdInjection(sf)).toBe(true);
  });

  it("détecte un <Script type=\"application/ld+json\"> (next/script)", () => {
    const sf = parseSourceFile(
      'k.tsx',
      `import Script from 'next/script';\nexport default function P() { return <Script type="application/ld+json">{}</Script> }`
    );
    expect(hasJsonLdInjection(sf)).toBe(true);
  });

  it("retourne false sur un <script> sans type ld+json", () => {
    const sf = parseSourceFile(
      'l.tsx',
      `export default function P() { return <script src="/analytics.js" /> }`
    );
    expect(hasJsonLdInjection(sf)).toBe(false);
  });

  it("supporte type via expression (curly braces)", () => {
    const sf = parseSourceFile(
      'm.tsx',
      `export default function P() { return <script type={"application/ld+json"}>{}</script> }`
    );
    expect(hasJsonLdInjection(sf)).toBe(true);
  });
});

describe('repo-scan/ast · hasUnoptimizedImagesInNextConfig', () => {
  it('détecte le motif images.unoptimized: true', () => {
    const r = hasUnoptimizedImagesInNextConfig(
      `const config = { images: { unoptimized: true } };\nexport default config;`
    );
    expect(r.match).toBe(true);
    expect(r.line).toBe(1);
  });

  it('ne déclenche pas sur unoptimized: false', () => {
    const r = hasUnoptimizedImagesInNextConfig(
      `const config = { images: { unoptimized: false } };`
    );
    expect(r.match).toBe(false);
  });

  it('ne déclenche pas si unoptimized: true est hors du bloc images', () => {
    const r = hasUnoptimizedImagesInNextConfig(
      `const config = { experimental: { unoptimized: true } };`
    );
    expect(r.match).toBe(false);
  });

  it("renvoie le numéro de ligne (1-based)", () => {
    const r = hasUnoptimizedImagesInNextConfig(`// line 1\n// line 2\nconst x = { images: { unoptimized: true } };`);
    expect(r.line).toBe(3);
  });
});
