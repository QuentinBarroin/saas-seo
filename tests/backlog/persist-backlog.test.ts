import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/db', () => {
  return {
    db: {
      backlogItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      seoAudit: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

const { db } = await import('@/lib/db');
const { replaceBacklogForAudit } = await import('@/lib/audits/persist-backlog');

describe('replaceBacklogForAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      return fn({
        backlogItem: db.backlogItem,
        seoAudit: db.seoAudit,
      } as Parameters<typeof fn>[0]);
    });
  });

  it('deletes existing todo items and creates new ones', async () => {
    const items = [
      {
        sourceFindingId: 'finding-1',
        title: 'Fix title',
        description: 'Fix the title tag',
        priority: 'P0' as const,
        effort: 'S' as const,
        category: 'technical' as const,
        filePathsTargeted: ['app/layout.tsx'],
        testsExpected: ['Check title'],
        definitionOfDone: 'Title fixed',
        acceptanceCriteria: ['Title is present'],
        claudePrompt: 'Fix the title',
      },
    ];

    const result = await replaceBacklogForAudit('audit-1', 'project-1', items);

    expect(db.backlogItem.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'todo' },
    });

    expect(db.backlogItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          projectId: 'project-1',
          title: 'Fix title',
          status: 'todo',
          sourceFindingId: 'finding-1',
        }),
      ],
    });

    expect(db.seoAudit.update).toHaveBeenCalledWith({
      where: { id: 'audit-1' },
      data: { backlogJson: items },
    });

    expect(result.count).toBe(1);
  });

  it('only deletes when items array is empty', async () => {
    const result = await replaceBacklogForAudit('audit-1', 'project-1', []);

    expect(db.backlogItem.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'todo' },
    });

    expect(db.backlogItem.createMany).not.toHaveBeenCalled();
    expect(result.count).toBe(0);
  });

  it('preserves non-todo items (idempotence)', async () => {
    const items = [
      {
        sourceFindingId: 'finding-1',
        title: 'Fix title',
        description: 'Fix the title tag',
        priority: 'P0' as const,
        effort: 'S' as const,
        category: 'technical' as const,
        filePathsTargeted: [],
        testsExpected: [],
        definitionOfDone: '',
        acceptanceCriteria: [],
        claudePrompt: 'Fix',
      },
    ];

    await replaceBacklogForAudit('audit-1', 'project-1', items);

    expect(db.backlogItem.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'todo' },
    });
  });
});
