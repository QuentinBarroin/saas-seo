import { describe, expect, it, vi } from 'vitest';
import { getSerpPageData } from '@/lib/serp/get-page-data';

vi.mock('@/lib/db', () => {
  return {
    db: {
      seoProject: {
        findUnique: vi.fn(),
      },
      keyword: {
        findMany: vi.fn(),
      },
      serpResult: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
      serpPAA: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

const { db } = await import('@/lib/db');

describe('getSerpPageData', () => {
  it('retourne null si le projet est introuvable', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null);
    const result = await getSerpPageData('unknown-id');
    expect(result).toBeNull();
  });

  it('retourne seedKeywords vide et selectedKeyword null quand pas de seeds', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);
    vi.mocked(db.keyword.findMany).mockResolvedValue([]);
    vi.mocked(db.serpResult.groupBy).mockResolvedValue([]);

    const result = await getSerpPageData('p1');

    expect(result).not.toBeNull();
    expect(result?.seedKeywords).toEqual([]);
    expect(result?.selectedKeyword).toBeNull();
    expect(result?.organic).toEqual([]);
    expect(result?.paa).toEqual([]);
  });

  it('sélectionne le premier seed par défaut', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);
    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { query: 'keyword a' } as never,
      { query: 'keyword b' } as never,
    ]);
    vi.mocked(db.serpResult.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpPAA.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpResult.groupBy).mockResolvedValue([]);

    const result = await getSerpPageData('p1');

    expect(result?.selectedKeyword).toBe('keyword a');
  });

  it('retourne organic et paa vides quand pas de SERP', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);
    vi.mocked(db.keyword.findMany).mockResolvedValue([{ query: 'test' } as never]);
    vi.mocked(db.serpResult.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpPAA.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpResult.groupBy).mockResolvedValue([]);

    const result = await getSerpPageData('p1', 'test');

    expect(result?.organic).toEqual([]);
    expect(result?.paa).toEqual([]);
    expect(result?.fetchedAt).toBeNull();
  });

  it('renvoie le dernier snapshot SERP trié par rank', async () => {
    const fetchedAt = new Date('2026-05-14T10:00:00Z');

    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);
    vi.mocked(db.keyword.findMany).mockResolvedValue([{ query: 'test' } as never]);
    vi.mocked(db.serpResult.findFirst).mockResolvedValue({ fetchedAt } as never);
    vi.mocked(db.serpResult.findMany).mockResolvedValue([
      { rank: 1, url: 'https://a.com', title: 'Title A', snippet: 'Snippet A', domain: 'a.com' },
      { rank: 2, url: 'https://b.com', title: 'Title B', snippet: 'Snippet B', domain: 'b.com' },
    ] as never);
    vi.mocked(db.serpPAA.findFirst).mockResolvedValue({ fetchedAt } as never);
    vi.mocked(db.serpPAA.findMany).mockResolvedValue([
      { question: 'Question 1?' } as never,
      { question: 'Question 2?' } as never,
    ]);
    vi.mocked(db.serpResult.groupBy).mockResolvedValue([]);

    const result = await getSerpPageData('p1', 'test');

    expect(result?.fetchedAt).toEqual(fetchedAt);
    expect(result?.organic).toHaveLength(2);
    if (result?.organic[0]) {
      expect(result.organic[0].rank).toBe(1);
    }
    if (result?.organic[1]) {
      expect(result.organic[1].rank).toBe(2);
    }
    expect(result?.paa).toEqual(['Question 1?', 'Question 2?']);
  });

  it('exclut le domaine du projet des concurrents', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'my-domain.com',
    } as never);
    vi.mocked(db.keyword.findMany).mockResolvedValue([{ query: 'test' } as never]);
    vi.mocked(db.serpResult.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpPAA.findFirst).mockResolvedValue(null);
    vi.mocked(db.serpResult.groupBy).mockResolvedValue([
      { domain: 'competitor-a.com', _count: { domain: 5 } } as never,
      { domain: 'competitor-b.com', _count: { domain: 3 } } as never,
    ]);

    const result = await getSerpPageData('p1', 'test');

    expect(result?.competitors).toEqual([
      { domain: 'competitor-a.com', frequency: 5 },
      { domain: 'competitor-b.com', frequency: 3 },
    ]);

    expect(vi.mocked(db.serpResult.groupBy)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ domain: { not: 'my-domain.com' } }),
      })
    );
  });
});
