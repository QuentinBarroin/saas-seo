import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectById } from '@/lib/projects/get-by-id';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: {
      findUnique: vi.fn(),
    },
  },
}));

describe('getProjectById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when project does not exist', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null as never);

    const result = await getProjectById('non-existent');

    expect(result).toBeNull();
    expect(db.seoProject.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent' },
      include: {
        competitors: {
          orderBy: [{ source: 'asc' }, { domain: 'asc' }],
          select: {
            id: true,
            domain: true,
            source: true,
            serpFrequency: true,
          },
        },
        keywords: {
          where: { source: 'seed' },
          orderBy: { query: 'asc' },
          select: {
            id: true,
            query: true,
          },
        },
      },
    });
  });

  it('returns project with competitors and seed keywords', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'https://test.com',
      repoUrl: null,
      type: 'saas',
      businessGoal: 'demos,leads',
      market: 'FR',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      competitors: [
        { id: 'c1', domain: 'comp1.com', source: 'manual', serpFrequency: null },
        { id: 'c2', domain: 'comp2.com', source: 'serp_auto', serpFrequency: 0.8 },
      ],
      keywords: [
        { id: 'k1', query: 'audit seo' },
        { id: 'k2', query: 'backlog' },
      ],
    } as never);

    const result = await getProjectById('proj-1');

    expect(result).toEqual({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'https://test.com',
      repoUrl: null,
      type: 'saas',
      businessGoal: 'demos,leads',
      market: 'FR',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      competitors: [
        { id: 'c1', domain: 'comp1.com', source: 'manual', serpFrequency: null },
        { id: 'c2', domain: 'comp2.com', source: 'serp_auto', serpFrequency: 0.8 },
      ],
      seedKeywords: [
        { id: 'k1', query: 'audit seo' },
        { id: 'k2', query: 'backlog' },
      ],
    });
  });

  it('returns project with empty competitors and keywords arrays', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-2',
      name: 'Empty Project',
      domain: 'https://empty.com',
      repoUrl: 'https://github.com/org/repo',
      type: 'blog',
      businessGoal: 'visibilite',
      market: 'US',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      competitors: [],
      keywords: [],
    } as never);

    const result = await getProjectById('proj-2');

    expect(result).toEqual({
      id: 'proj-2',
      name: 'Empty Project',
      domain: 'https://empty.com',
      repoUrl: 'https://github.com/org/repo',
      type: 'blog',
      businessGoal: 'visibilite',
      market: 'US',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      competitors: [],
      seedKeywords: [],
    });
  });
});
