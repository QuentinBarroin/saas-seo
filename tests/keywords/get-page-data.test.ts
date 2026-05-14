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
  },
}));

describe('getKeywordsPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    });

    expect(result?.keywords).toHaveLength(4);
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
