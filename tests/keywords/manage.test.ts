import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSeedKeywords, removeSeedKeyword } from '@/lib/keywords/manage';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    keyword: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('addSeedKeywords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero when queries array is empty', async () => {
    const result = await addSeedKeywords('proj-1', []);

    expect(result).toEqual({ inserted: 0, skipped: 0 });
    expect(db.keyword.findMany).not.toHaveBeenCalled();
  });

  it('inserts all keywords when none exist', async () => {
    vi.mocked(db.keyword.findMany).mockResolvedValue([] as never);
    vi.mocked(db.keyword.createMany).mockResolvedValue({} as never);

    const result = await addSeedKeywords('proj-1', ['audit seo', 'backlog']);

    expect(db.keyword.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'proj-1',
        query: { in: ['audit seo', 'backlog'] },
      },
      select: { query: true },
    });
    expect(db.keyword.createMany).toHaveBeenCalledWith({
      data: [
        { projectId: 'proj-1', query: 'audit seo', source: 'seed' },
        { projectId: 'proj-1', query: 'backlog', source: 'seed' },
      ],
    });
    expect(result).toEqual({ inserted: 2, skipped: 0 });
  });

  it('deduplicates existing keywords', async () => {
    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { query: 'audit seo' },
    ] as never);
    vi.mocked(db.keyword.createMany).mockResolvedValue({} as never);

    const result = await addSeedKeywords('proj-1', ['audit seo', 'backlog', 'new keyword']);

    expect(db.keyword.createMany).toHaveBeenCalledWith({
      data: [
        { projectId: 'proj-1', query: 'backlog', source: 'seed' },
        { projectId: 'proj-1', query: 'new keyword', source: 'seed' },
      ],
    });
    expect(result).toEqual({ inserted: 2, skipped: 1 });
  });

  it('skips all when all keywords already exist', async () => {
    vi.mocked(db.keyword.findMany).mockResolvedValue([
      { query: 'audit seo' },
      { query: 'backlog' },
    ] as never);

    const result = await addSeedKeywords('proj-1', ['audit seo', 'backlog']);

    expect(db.keyword.createMany).not.toHaveBeenCalled();
    expect(result).toEqual({ inserted: 0, skipped: 2 });
  });
});

describe('removeSeedKeyword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes keyword with paranoid checks', async () => {
    vi.mocked(db.keyword.deleteMany).mockResolvedValue({} as never);

    await removeSeedKeyword('kw-1', 'proj-1');

    expect(db.keyword.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'kw-1',
        projectId: 'proj-1',
        source: 'seed',
      },
    });
  });

  it('only deletes seed keywords', async () => {
    vi.mocked(db.keyword.deleteMany).mockResolvedValue({} as never);

    await removeSeedKeyword('kw-2', 'proj-2');

    expect(db.keyword.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          source: 'seed',
        }),
      })
    );
  });
});
