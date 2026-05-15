import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKeywordsPageData } from '@/lib/keywords/get-page-data';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: {
      findUnique: vi.fn(),
    },
    keyword: {
      findMany: vi.fn(),
    },
    gscQueryStat: {
      findMany: vi.fn(),
    },
  },
}));

describe('getKeywordsPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Par défaut : aucune donnée GSC importée.
    vi.mocked(db.gscQueryStat.findMany).mockResolvedValue([] as never);
  });

  it('returns null if project not found', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null as never);

    const result = await getKeywordsPageData('nonexistent-project-id');

    expect(result).toBeNull();
    expect(db.seoProject.findUnique).toHaveBeenCalledWith({
      where: { id: 'nonexistent-project-id' },
      select: { id: true, name: true },
    });
  });

  it('returns empty keywords and existingClusters if project has no keywords', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-123',
      name: 'Test Project',
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([] as never);

    const result = await getKeywordsPageData('proj-123');

    expect(result).toEqual({
      project: { id: 'proj-123', name: 'Test Project' },
      keywords: [],
      existingClusters: [],
      hasGscData: false,
    });
  });

  it('returns keywords with deduped and sorted existingClusters', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-456',
      name: 'Another Project',
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([
      {
        id: 'kw-1',
        query: 'audit seo',
        cluster: 'SEO',
        intent: 'tofu',
        isMoneyKeyword: true,
        source: 'seed',
      },
      {
        id: 'kw-2',
        query: 'audit technique',
        cluster: 'SEO',
        intent: 'mofu',
        isMoneyKeyword: false,
        source: 'seed',
      },
      {
        id: 'kw-3',
        query: 'consultant seo',
        cluster: 'Services',
        intent: 'bofu',
        isMoneyKeyword: true,
        source: 'seed',
      },
      {
        id: 'kw-4',
        query: 'novera',
        cluster: null,
        intent: 'navigational',
        isMoneyKeyword: false,
        source: 'seed',
      },
    ] as never);

    const result = await getKeywordsPageData('proj-456');

    expect(result).toEqual({
      project: { id: 'proj-456', name: 'Another Project' },
      keywords: expect.any(Array),
      existingClusters: ['SEO', 'Services'],
      hasGscData: false,
    });

    expect(result?.keywords).toHaveLength(4);
  });

  it('joint les métriques GSC aux keywords seed (insensible à la casse)', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-gsc',
      name: 'GSC Project',
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { id: 'kw-1', query: 'Audit SEO', cluster: null, intent: null, isMoneyKeyword: false, source: 'seed' },
      { id: 'kw-2', query: 'consultant', cluster: null, intent: null, isMoneyKeyword: false, source: 'seed' },
    ] as never);

    vi.mocked(db.gscQueryStat.findMany).mockResolvedValue([
      { query: 'audit seo', clicks: 10, impressions: 100, position: 4 },
      { query: 'audit seo', clicks: 5, impressions: 100, position: 8 },
    ] as never);

    const result = await getKeywordsPageData('proj-gsc');

    expect(result?.hasGscData).toBe(true);
    const matched = result?.keywords.find((k) => k.id === 'kw-1');
    expect(matched?.gsc).toEqual({ clicks: 15, impressions: 200, ctr: 15 / 200, position: 6 });
    const unmatched = result?.keywords.find((k) => k.id === 'kw-2');
    expect(unmatched?.gsc).toBeNull();
  });

  it('returns keywords ordered by isMoneyKeyword desc, cluster asc, query asc', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-789',
      name: 'Ordered Project',
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { id: 'kw-1', query: 'a', cluster: 'A', isMoneyKeyword: true },
      { id: 'kw-2', query: 'b', cluster: 'B', isMoneyKeyword: false },
    ] as never);

    await getKeywordsPageData('proj-789');

    expect(db.keyword.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-789' },
      select: {
        id: true,
        query: true,
        cluster: true,
        intent: true,
        isMoneyKeyword: true,
        source: true,
      },
      orderBy: [{ isMoneyKeyword: 'desc' }, { cluster: 'asc' }, { query: 'asc' }],
    });
  });
});
