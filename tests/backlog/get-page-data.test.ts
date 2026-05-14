import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBacklogPageData } from '@/lib/backlog/get-page-data';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: {
      findUnique: vi.fn(),
    },
    backlogItem: {
      findMany: vi.fn(),
    },
  },
}));

describe('getBacklogPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null if project not found', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null as never);

    const result = await getBacklogPageData('unknown-id');
    expect(result).toBeNull();
  });

  it('returns empty items if no backlog items exist', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);

    vi.mocked(db.backlogItem.findMany).mockResolvedValue([] as never);

    const result = await getBacklogPageData('proj-1');

    expect(result).toEqual({
      project: { id: 'proj-1', name: 'Test Project', domain: 'example.com' },
      items: [],
      counts: {
        total: 0,
        byPriority: { P0: 0, P1: 0, P2: 0 },
        byStatus: { todo: 0, in_progress: 0, done: 0, discarded: 0 },
        byCategory: {},
      },
    });
  });

  it('filters by priority, category, and status', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);

    vi.mocked(db.backlogItem.findMany).mockResolvedValue([
      {
        id: 'item-1',
        title: 'Fix critical issue',
        description: 'Urgent fix needed',
        priority: 'P0',
        effort: 'M',
        category: 'technical',
        status: 'todo',
        acceptanceCriteria: ['AC1', 'AC2'],
        claudePrompt: 'Fix this',
        filePathsTargeted: ['src/index.ts'],
        testsExpected: ['test-1'],
        definitionOfDone: 'All tests pass',
        finding: null,
      },
    ] as never);

    const result = await getBacklogPageData('proj-1', {
      priority: 'P0',
      category: 'technical',
      status: 'todo',
    });

    expect(result).toBeDefined();
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.priority).toBe('P0');

    expect(vi.mocked(db.backlogItem.findMany)).toHaveBeenCalledWith({
      where: {
        projectId: 'proj-1',
        priority: 'P0',
        category: 'technical',
        status: 'todo',
      },
      include: {
        finding: {
          select: {
            id: true,
            rule: true,
            title: true,
            severity: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('handles invalid JSON fields defensively', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);

    vi.mocked(db.backlogItem.findMany).mockResolvedValue([
      {
        id: 'item-1',
        title: 'Task',
        description: 'Desc',
        priority: 'P1',
        effort: 'S',
        category: 'content',
        status: 'todo',
        acceptanceCriteria: null,
        claudePrompt: null,
        filePathsTargeted: 'invalid-json',
        testsExpected: { not: 'array' },
        definitionOfDone: null,
        finding: null,
      },
    ] as never);

    const result = await getBacklogPageData('proj-1');

    expect(result).toBeDefined();
    expect(result?.items[0]?.acceptanceCriteria).toEqual([]);
    expect(result?.items[0]?.filePathsTargeted).toEqual([]);
    expect(result?.items[0]?.testsExpected).toEqual([]);
  });

  it('computes counts correctly', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      domain: 'example.com',
    } as never);

    vi.mocked(db.backlogItem.findMany).mockResolvedValue([
      {
        id: 'item-1',
        priority: 'P0',
        category: 'technical',
        status: 'todo',
        acceptanceCriteria: [],
        filePathsTargeted: [],
        testsExpected: [],
        finding: null,
      },
      {
        id: 'item-2',
        priority: 'P0',
        category: 'content',
        status: 'done',
        acceptanceCriteria: [],
        filePathsTargeted: [],
        testsExpected: [],
        finding: null,
      },
      {
        id: 'item-3',
        priority: 'P1',
        category: 'technical',
        status: 'in_progress',
        acceptanceCriteria: [],
        filePathsTargeted: [],
        testsExpected: [],
        finding: null,
      },
    ] as never);

    const result = await getBacklogPageData('proj-1');

    expect(result).toBeDefined();
    expect(result?.counts.total).toBe(3);
    expect(result?.counts.byPriority).toEqual({ P0: 2, P1: 1, P2: 0 });
    expect(result?.counts.byStatus).toEqual({
      todo: 1,
      in_progress: 1,
      done: 1,
      discarded: 0,
    });
    expect(result?.counts.byCategory).toEqual({ technical: 2, content: 1 });
  });
});
