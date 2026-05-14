import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: {
      findUnique: vi.fn(),
    },
    seoPage: {
      findMany: vi.fn(),
    },
    keyword: {
      aggregate: vi.fn(),
    },
  },
}));

import { getContentGapPageData } from '@/lib/content-gap/get-page-data';
import { db } from '@/lib/db';

describe('getContentGapPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne null si projet introuvable', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null);

    const result = await getContentGapPageData('p-unknown');

    expect(result).toBeNull();
  });

  it('retourne une structure vide si projet sans pages ni clusters', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Shooting Pilot',
      domain: 'shooting-pilot.com',
    } as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([] as never);
    vi.mocked(db.keyword.aggregate).mockResolvedValue({ _count: { cluster: 0 } } as never);

    const result = await getContentGapPageData('p1');

    expect(result).toEqual({
      project: { id: 'p1', name: 'Shooting Pilot', domain: 'shooting-pilot.com' },
      recommended: [],
      existing: [],
      clustersTotal: 0,
      hasAnyCluster: false,
    });
  });

  it('retourne 2 recommended + 1 existing correctement', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test Project',
      domain: 'test.com',
    } as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([
      {
        id: 'page1',
        cluster: 'Cluster A',
        slug: 'cluster-a',
        targetKeyword: 'mot clé A',
        pageType: 'pillar',
        status: 'recommended',
        url: null,
        title: null,
      },
      {
        id: 'page2',
        cluster: 'Cluster B',
        slug: 'cluster-b',
        targetKeyword: 'mot clé B',
        pageType: null,
        status: 'recommended',
        url: null,
        title: null,
      },
      {
        id: 'page3',
        cluster: 'Cluster C',
        slug: 'cluster-c',
        targetKeyword: 'mot clé C',
        pageType: null,
        status: 'existing',
        url: 'https://test.com/cluster-c',
        title: 'Cluster C Page',
      },
    ] as never);
    vi.mocked(db.keyword.aggregate).mockResolvedValue({ _count: { cluster: 3 } } as never);

    const result = await getContentGapPageData('p1');

    expect(result).toEqual({
      project: { id: 'p1', name: 'Test Project', domain: 'test.com' },
      recommended: [
        {
          id: 'page1',
          cluster: 'Cluster A',
          slug: 'cluster-a',
          targetKeyword: 'mot clé A',
          pageType: 'pillar',
        },
        {
          id: 'page2',
          cluster: 'Cluster B',
          slug: 'cluster-b',
          targetKeyword: 'mot clé B',
          pageType: null,
        },
      ],
      existing: [
        {
          id: 'page3',
          cluster: 'Cluster C',
          url: 'https://test.com/cluster-c',
          slug: 'cluster-c',
          targetKeyword: 'mot clé C',
          title: 'Cluster C Page',
        },
      ],
      clustersTotal: 3,
      hasAnyCluster: true,
    });
  });

  it('hasAnyCluster est false si clustersTotal === 0', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test',
      domain: 'test.com',
    } as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([] as never);
    vi.mocked(db.keyword.aggregate).mockResolvedValue({ _count: { cluster: 0 } } as never);

    const result = await getContentGapPageData('p1');

    expect(result?.hasAnyCluster).toBe(false);
  });

  it('hasAnyCluster est true si clustersTotal > 0', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Test',
      domain: 'test.com',
    } as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([] as never);
    vi.mocked(db.keyword.aggregate).mockResolvedValue({ _count: { cluster: 5 } } as never);

    const result = await getContentGapPageData('p1');

    expect(result?.hasAnyCluster).toBe(true);
    expect(result?.clustersTotal).toBe(5);
  });
});
