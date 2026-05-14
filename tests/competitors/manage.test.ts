import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCompetitor, removeCompetitor } from '@/lib/competitors/manage';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    competitor: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('addCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates new competitor when not existing', async () => {
    vi.mocked(db.competitor.findFirst).mockResolvedValue(null as never);
    vi.mocked(db.competitor.create).mockResolvedValue({} as never);

    await addCompetitor('proj-1', 'newcomp.com');

    expect(db.competitor.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'proj-1', domain: 'newcomp.com' },
    });
    expect(db.competitor.create).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        domain: 'newcomp.com',
        source: 'manual',
      },
    });
  });

  it('does nothing when competitor already exists as manual', async () => {
    vi.mocked(db.competitor.findFirst).mockResolvedValue({
      id: 'c1',
      source: 'manual',
    } as never);

    await addCompetitor('proj-1', 'existingmanual.com');

    expect(db.competitor.findFirst).toHaveBeenCalled();
    expect(db.competitor.update).not.toHaveBeenCalled();
    expect(db.competitor.create).not.toHaveBeenCalled();
  });

  it('updates source to manual when competitor exists as serp_auto', async () => {
    vi.mocked(db.competitor.findFirst).mockResolvedValue({
      id: 'c2',
      source: 'serp_auto',
    } as never);
    vi.mocked(db.competitor.update).mockResolvedValue({} as never);

    await addCompetitor('proj-1', 'autocomp.com');

    expect(db.competitor.findFirst).toHaveBeenCalled();
    expect(db.competitor.update).toHaveBeenCalledWith({
      where: { id: 'c2' },
      data: { source: 'manual' },
    });
    expect(db.competitor.create).not.toHaveBeenCalled();
  });
});

describe('removeCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes competitor with paranoid checks', async () => {
    vi.mocked(db.competitor.deleteMany).mockResolvedValue({} as never);

    await removeCompetitor('comp-1', 'proj-1');

    expect(db.competitor.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'comp-1',
        projectId: 'proj-1',
        source: 'manual',
      },
    });
  });

  it('only deletes manual competitors', async () => {
    vi.mocked(db.competitor.deleteMany).mockResolvedValue({} as never);

    await removeCompetitor('comp-2', 'proj-2');

    expect(db.competitor.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          source: 'manual',
        }),
      })
    );
  });
});
