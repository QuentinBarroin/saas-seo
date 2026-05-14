import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    seoPage: {
      findUnique: vi.fn(),
    },
    keyword: {
      findMany: vi.fn(),
    },
  },
}));

import { getPageDetail } from '@/lib/pages/get-page-detail';
import { db } from '@/lib/db';

describe('getPageDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne null si page introuvable', async () => {
    vi.mocked(db.seoPage.findUnique).mockResolvedValue(null);

    const result = await getPageDetail('page-unknown');

    expect(result).toBeNull();
  });

  it('retourne null si page sans project', async () => {
    vi.mocked(db.seoPage.findUnique).mockResolvedValue({
      id: 'page1',
      projectId: 'p1',
      url: 'https://test.com/page1',
      project: null,
    } as never);

    const result = await getPageDetail('page1');

    expect(result).toBeNull();
  });

  it('retourne clusterKeywords vide si page sans cluster', async () => {
    vi.mocked(db.seoPage.findUnique).mockResolvedValue({
      id: 'page1',
      projectId: 'p1',
      url: 'https://test.com/page1',
      slug: 'page1',
      pageType: 'pillar',
      targetKeyword: 'keyword A',
      cluster: null,
      status: 'recommended',
      title: null,
      description: null,
      h1: null,
      wordCount: null,
      indexable: null,
      canonical: null,
      hasJsonLd: null,
      hasFaq: null,
      hasCta: null,
      technicalScore: null,
      contentScore: null,
      geoScore: null,
      conversionScore: null,
      project: {
        id: 'p1',
        name: 'Test Project',
        domain: 'test.com',
      },
    } as never);

    const result = await getPageDetail('page1');

    expect(result).toBeDefined();
    expect(result?.clusterKeywords).toEqual([]);
    expect(db.keyword.findMany).not.toHaveBeenCalled();
  });

  it('retourne clusterKeywords avec money en premier si page avec cluster', async () => {
    vi.mocked(db.seoPage.findUnique).mockResolvedValue({
      id: 'page2',
      projectId: 'p1',
      url: 'https://test.com/page2',
      slug: 'page2',
      pageType: 'pillar',
      targetKeyword: 'keyword B',
      cluster: 'Cluster B',
      status: 'existing',
      title: 'Page B',
      description: 'Description B',
      h1: 'H1 B',
      wordCount: 500,
      indexable: true,
      canonical: 'https://test.com/page2',
      hasJsonLd: true,
      hasFaq: false,
      hasCta: true,
      technicalScore: 85.5,
      contentScore: 70.0,
      geoScore: 90.2,
      conversionScore: 65.0,
      project: {
        id: 'p1',
        name: 'Test Project',
        domain: 'test.com',
      },
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { query: 'another money', isMoneyKeyword: true },
      { query: 'money keyword', isMoneyKeyword: true },
      { query: 'normal keyword', isMoneyKeyword: false },
    ] as never);

    const result = await getPageDetail('page2');

    expect(result).toBeDefined();
    expect(result?.clusterKeywords).toEqual([
      { query: 'another money', isMoneyKeyword: true },
      { query: 'money keyword', isMoneyKeyword: true },
      { query: 'normal keyword', isMoneyKeyword: false },
    ]);
    expect(db.keyword.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'p1',
        cluster: 'Cluster B',
      },
      select: {
        query: true,
        isMoneyKeyword: true,
      },
      orderBy: [{ isMoneyKeyword: 'desc' }, { query: 'asc' }],
    });
  });

  it('retourne la shape complète du projet et de la page', async () => {
    vi.mocked(db.seoPage.findUnique).mockResolvedValue({
      id: 'page3',
      projectId: 'p2',
      url: 'https://example.com/page3',
      slug: 'page3',
      pageType: 'child',
      targetKeyword: 'target kw',
      cluster: 'Cluster X',
      status: 'done',
      title: 'Title X',
      description: 'Description X',
      h1: 'H1 X',
      wordCount: 1500,
      indexable: true,
      canonical: 'https://example.com/page3',
      hasJsonLd: false,
      hasFaq: true,
      hasCta: false,
      technicalScore: 95.0,
      contentScore: 88.5,
      geoScore: 92.0,
      conversionScore: 78.0,
      project: {
        id: 'p2',
        name: 'Project X',
        domain: 'example.com',
      },
    } as never);

    vi.mocked(db.keyword.findMany).mockResolvedValue([] as never);

    const result = await getPageDetail('page3');

    expect(result).toEqual({
      project: {
        id: 'p2',
        name: 'Project X',
        domain: 'example.com',
      },
      page: {
        id: 'page3',
        url: 'https://example.com/page3',
        slug: 'page3',
        pageType: 'child',
        targetKeyword: 'target kw',
        cluster: 'Cluster X',
        status: 'done',
        title: 'Title X',
        description: 'Description X',
        h1: 'H1 X',
        wordCount: 1500,
        indexable: true,
        canonical: 'https://example.com/page3',
        hasJsonLd: false,
        hasFaq: true,
        hasCta: false,
        scores: {
          technical: 95.0,
          content: 88.5,
          geo: 92.0,
          conversion: 78.0,
        },
      },
      clusterKeywords: [],
    });
  });
});
