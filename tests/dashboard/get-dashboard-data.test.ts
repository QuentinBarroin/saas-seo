import { describe, expect, it, vi } from 'vitest';
import {
  listProjectSummaries,
  getProjectDashboard,
} from '@/lib/dashboard/get-dashboard-data';

vi.mock('@/lib/db', () => {
  return {
    db: {
      seoProject: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      seoAudit: {
        findFirst: vi.fn(),
      },
    },
  };
});

const { db } = await import('@/lib/db');

describe('listProjectSummaries', () => {
  it('retourne la liste des projets avec leur dernier audit done', async () => {
    const mockProjects = [
      {
        id: 'p1',
        name: 'Project 1',
        domain: 'example1.com',
        market: 'FR',
        _count: { keywords: 10, competitors: 3, audits: 2 },
        audits: [
          {
            id: 'a1',
            status: 'done',
            globalScore: 75.5,
            finishedAt: new Date('2026-05-14T10:00:00Z'),
          },
        ],
      },
      {
        id: 'p2',
        name: 'Project 2',
        domain: 'example2.com',
        market: 'US',
        _count: { keywords: 5, competitors: 2, audits: 0 },
        audits: [],
      },
    ];

    vi.mocked(db.seoProject.findMany).mockResolvedValue(mockProjects as never);

    const result = await listProjectSummaries();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'p1',
      name: 'Project 1',
      domain: 'example1.com',
      market: 'FR',
      counts: { keywords: 10, competitors: 3, audits: 2 },
    });
    expect(result[0]?.lastAudit).toMatchObject({
      id: 'a1',
      status: 'done',
      globalScore: 75.5,
    });
    expect(result[1]?.lastAudit).toBeNull();
  });

  it('retourne une liste vide si aucun projet', async () => {
    vi.mocked(db.seoProject.findMany).mockResolvedValue([]);

    const result = await listProjectSummaries();

    expect(result).toEqual([]);
  });
});

describe('getProjectDashboard', () => {
  it('retourne null si le projet est introuvable', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null);

    const result = await getProjectDashboard('unknown-id');

    expect(result).toBeNull();
  });

  it("retourne audit null si le projet n'a pas d'audit done", async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Project 1',
      domain: 'example.com',
    } as never);
    vi.mocked(db.seoAudit.findFirst).mockResolvedValue(null);

    const result = await getProjectDashboard('p1');

    expect(result).not.toBeNull();
    expect(result?.project).toMatchObject({
      id: 'p1',
      name: 'Project 1',
      domain: 'example.com',
    });
    expect(result?.audit).toBeNull();
    expect(result?.hasPendingAudit).toBe(false);
  });

  it('retourne les scores et risques si audit done existe', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Project 1',
      domain: 'example.com',
    } as never);

    const mockAudit = {
      id: 'a1',
      status: 'done',
      finishedAt: new Date('2026-05-14T10:00:00Z'),
      globalScore: 75.5,
      technicalScore: 80.0,
      contentScore: 70.0,
      architectureScore: 75.0,
      conversionScore: 65.0,
      geoScore: 85.0,
      findings: [
        {
          id: 'f1',
          severity: 'critical',
          title: 'Critical issue',
          pageUrl: 'https://example.com/page1',
          filePath: null,
          rule: 'RULE_001',
        },
        {
          id: 'f2',
          severity: 'high',
          title: 'High issue',
          pageUrl: null,
          filePath: '/src/page.tsx',
          rule: 'RULE_002',
        },
      ],
    };

    vi.mocked(db.seoAudit.findFirst)
      .mockResolvedValueOnce(mockAudit as never)
      .mockResolvedValueOnce(null);

    const result = await getProjectDashboard('p1');

    expect(result).not.toBeNull();
    expect(result?.audit).not.toBeNull();
    expect(result?.audit?.scores).toMatchObject({
      global: 75.5,
      technical: 80.0,
      content: 70.0,
      architecture: 75.0,
      conversion: 65.0,
      geo: 85.0,
    });
    expect(result?.audit?.topRisks).toHaveLength(2);
    expect(result?.audit?.topRisks[0]).toMatchObject({
      id: 'f1',
      severity: 'critical',
      title: 'Critical issue',
    });
    expect(result?.hasPendingAudit).toBe(false);
  });

  it('détecte hasPendingAudit si un audit pending/running existe', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue({
      id: 'p1',
      name: 'Project 1',
      domain: 'example.com',
    } as never);

    vi.mocked(db.seoAudit.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'a-pending', status: 'running' } as never);

    const result = await getProjectDashboard('p1');

    expect(result).not.toBeNull();
    expect(result?.audit).toBeNull();
    expect(result?.hasPendingAudit).toBe(true);
  });
});
