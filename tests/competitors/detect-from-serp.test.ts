import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';
import { detectCompetitorsFromSerp } from '@/lib/competitors/detect-from-serp';

type MockDbClient = {
  competitor: {
    deleteMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  serpResult: {
    groupBy: ReturnType<typeof vi.fn>;
  };
};

describe('detectCompetitorsFromSerp', () => {
  let mockDb: MockDbClient;

  beforeEach(() => {
    mockDb = {
      competitor: {
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      serpResult: {
        groupBy: vi.fn(),
      },
    };
  });

  it('purge anciens serp_auto et reset serpFrequency des manual quand aucun SerpResult', async () => {
    mockDb.competitor.deleteMany.mockResolvedValue({ count: 3 });
    mockDb.competitor.updateMany.mockResolvedValue({ count: 1 });
    mockDb.competitor.findMany.mockResolvedValue([]);
    mockDb.serpResult.groupBy.mockResolvedValue([]);

    const result = await detectCompetitorsFromSerp(
      mockDb as unknown as Prisma.TransactionClient,
      {
        projectId: 'p1',
        projectDomain: 'my-domain.com',
      }
    );

    expect(result).toEqual({
      domainsDetected: 0,
      serpAutoCreated: 0,
      manualUpdated: 0,
      serpAutoPurged: 3,
    });

    expect(mockDb.competitor.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'p1', source: 'serp_auto' },
    });

    expect(mockDb.competitor.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'p1', source: 'manual' },
      data: { serpFrequency: null },
    });
  });

  it('crée de nouveaux serp_auto pour domaines détectés', async () => {
    mockDb.competitor.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.updateMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.findMany.mockResolvedValue([]);
    mockDb.serpResult.groupBy.mockResolvedValue([
      { domain: 'competitor-a.com', _count: { domain: 5 } },
      { domain: 'competitor-b.com', _count: { domain: 3 } },
    ]);
    mockDb.competitor.upsert.mockResolvedValue({} as never);

    const result = await detectCompetitorsFromSerp(
      mockDb as unknown as Prisma.TransactionClient,
      {
        projectId: 'p1',
        projectDomain: 'my-domain.com',
      }
    );

    expect(result).toEqual({
      domainsDetected: 2,
      serpAutoCreated: 2,
      manualUpdated: 0,
      serpAutoPurged: 0,
    });

    expect(mockDb.competitor.upsert).toHaveBeenCalledTimes(2);
    expect(mockDb.competitor.upsert).toHaveBeenCalledWith({
      where: { projectId_domain: { projectId: 'p1', domain: 'competitor-a.com' } },
      update: { serpFrequency: 5 },
      create: {
        projectId: 'p1',
        domain: 'competitor-a.com',
        source: 'serp_auto',
        serpFrequency: 5,
      },
    });
  });

  it('met à jour serpFrequency d un concurrent manual existant', async () => {
    mockDb.competitor.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.updateMany.mockResolvedValue({ count: 1 });
    mockDb.competitor.findMany.mockResolvedValue([{ domain: 'competitor-manual.com' }]);
    mockDb.serpResult.groupBy.mockResolvedValue([
      { domain: 'competitor-manual.com', _count: { domain: 8 } },
    ]);
    mockDb.competitor.upsert.mockResolvedValue({} as never);

    const result = await detectCompetitorsFromSerp(
      mockDb as unknown as Prisma.TransactionClient,
      {
        projectId: 'p1',
        projectDomain: 'my-domain.com',
      }
    );

    expect(result).toEqual({
      domainsDetected: 1,
      serpAutoCreated: 0,
      manualUpdated: 1,
      serpAutoPurged: 0,
    });

    expect(mockDb.competitor.upsert).toHaveBeenCalledWith({
      where: { projectId_domain: { projectId: 'p1', domain: 'competitor-manual.com' } },
      update: { serpFrequency: 8 },
      create: {
        projectId: 'p1',
        domain: 'competitor-manual.com',
        source: 'serp_auto',
        serpFrequency: 8,
      },
    });
  });

  it('purge anciens serp_auto qui ne sont plus dans le top', async () => {
    mockDb.competitor.deleteMany.mockResolvedValue({ count: 5 });
    mockDb.competitor.updateMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.findMany.mockResolvedValue([]);
    mockDb.serpResult.groupBy.mockResolvedValue([
      { domain: 'new-competitor.com', _count: { domain: 2 } },
    ]);
    mockDb.competitor.upsert.mockResolvedValue({} as never);

    const result = await detectCompetitorsFromSerp(
      mockDb as unknown as Prisma.TransactionClient,
      {
        projectId: 'p1',
        projectDomain: 'my-domain.com',
      }
    );

    expect(result).toEqual({
      domainsDetected: 1,
      serpAutoCreated: 1,
      manualUpdated: 0,
      serpAutoPurged: 5,
    });
  });

  it('exclut le domaine du projet du groupBy via where.domain.not', async () => {
    mockDb.competitor.deleteMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.updateMany.mockResolvedValue({ count: 0 });
    mockDb.competitor.findMany.mockResolvedValue([]);
    mockDb.serpResult.groupBy.mockResolvedValue([]);

    await detectCompetitorsFromSerp(mockDb as unknown as Prisma.TransactionClient, {
      projectId: 'p1',
      projectDomain: 'my-domain.com',
    });

    expect(mockDb.serpResult.groupBy).toHaveBeenCalledWith({
      by: ['domain'],
      where: { projectId: 'p1', domain: { not: 'my-domain.com' } },
      _count: { domain: true },
    });
  });
});
