import { describe, expect, it } from 'vitest';
import { aggregateGscByQuery } from '@/lib/keywords/gsc-metrics';

describe('keywords/gsc-metrics · aggregateGscByQuery', () => {
  it('agrège clics et impressions par requête', () => {
    const map = aggregateGscByQuery([
      { query: 'audit seo', clicks: 3, impressions: 40, position: 5 },
      { query: 'audit seo', clicks: 7, impressions: 60, position: 5 },
    ]);
    const m = map.get('audit seo');
    expect(m?.clicks).toBe(10);
    expect(m?.impressions).toBe(100);
  });

  it('calcule le CTR comme clics / impressions cumulés', () => {
    const map = aggregateGscByQuery([
      { query: 'q', clicks: 2, impressions: 50, position: 3 },
      { query: 'q', clicks: 8, impressions: 150, position: 3 },
    ]);
    expect(map.get('q')?.ctr).toBeCloseTo(10 / 200);
  });

  it('pondère la position moyenne par les impressions', () => {
    const map = aggregateGscByQuery([
      { query: 'q', clicks: 0, impressions: 900, position: 2 },
      { query: 'q', clicks: 0, impressions: 100, position: 12 },
    ]);
    // (2*900 + 12*100) / 1000 = 3
    expect(map.get('q')?.position).toBe(3);
  });

  it('sans impressions → CTR 0 et position en moyenne simple', () => {
    const map = aggregateGscByQuery([
      { query: 'q', clicks: 0, impressions: 0, position: 10 },
      { query: 'q', clicks: 0, impressions: 0, position: 20 },
    ]);
    expect(map.get('q')?.ctr).toBe(0);
    expect(map.get('q')?.position).toBe(15);
  });

  it('regroupe sans tenir compte de la casse ni des espaces de bord', () => {
    const map = aggregateGscByQuery([
      { query: 'Audit SEO', clicks: 1, impressions: 10, position: 5 },
      { query: '  audit seo  ', clicks: 1, impressions: 10, position: 5 },
    ]);
    expect(map.size).toBe(1);
    expect(map.get('audit seo')?.clicks).toBe(2);
  });

  it('ignore les lignes sans requête', () => {
    const map = aggregateGscByQuery([
      { query: null, clicks: 5, impressions: 50, position: 1 },
      { query: '', clicks: 5, impressions: 50, position: 1 },
      { query: 'q', clicks: 1, impressions: 10, position: 1 },
    ]);
    expect(map.size).toBe(1);
    expect(map.has('q')).toBe(true);
  });

  it('liste vide → Map vide', () => {
    expect(aggregateGscByQuery([]).size).toBe(0);
  });
});
