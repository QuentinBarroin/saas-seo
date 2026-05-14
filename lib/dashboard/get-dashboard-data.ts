import { db } from '@/lib/db';

export type ProjectSummary = {
  id: string;
  name: string;
  domain: string;
  market: string;
  counts: { keywords: number; competitors: number; audits: number };
  lastAudit: {
    id: string;
    status: string;
    globalScore: number | null;
    finishedAt: Date | null;
  } | null;
};

export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await db.seoProject.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      domain: true,
      market: true,
      _count: {
        select: { keywords: true, competitors: true, audits: true },
      },
      audits: {
        where: { status: 'done' },
        orderBy: { finishedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          globalScore: true,
          finishedAt: true,
        },
      },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    market: p.market,
    counts: {
      keywords: p._count.keywords,
      competitors: p._count.competitors,
      audits: p._count.audits,
    },
    lastAudit: p.audits[0] ?? null,
  }));
}

export type ProjectDashboard = {
  project: { id: string; name: string; domain: string };
  audit: {
    id: string;
    status: string;
    finishedAt: Date | null;
    scores: {
      global: number | null;
      technical: number | null;
      content: number | null;
      architecture: number | null;
      conversion: number | null;
      geo: number | null;
    };
    topRisks: Array<{
      id: string;
      severity: 'critical' | 'high';
      title: string;
      pageUrl: string | null;
      filePath: string | null;
      rule: string;
    }>;
  } | null;
  hasPendingAudit: boolean;
};

export async function getProjectDashboard(
  projectId: string
): Promise<ProjectDashboard | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      domain: true,
    },
  });

  if (!project) {
    return null;
  }

  const lastDoneAudit = await db.seoAudit.findFirst({
    where: { projectId, status: 'done' },
    orderBy: { finishedAt: 'desc' },
    select: {
      id: true,
      status: true,
      finishedAt: true,
      globalScore: true,
      technicalScore: true,
      contentScore: true,
      architectureScore: true,
      conversionScore: true,
      geoScore: true,
      findings: {
        where: {
          severity: { in: ['critical', 'high'] },
        },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          severity: true,
          title: true,
          pageUrl: true,
          filePath: true,
          rule: true,
        },
      },
    },
  });

  const pendingAudit = await db.seoAudit.findFirst({
    where: {
      projectId,
      status: { in: ['pending', 'running'] },
    },
  });

  return {
    project,
    audit: lastDoneAudit
      ? {
          id: lastDoneAudit.id,
          status: lastDoneAudit.status,
          finishedAt: lastDoneAudit.finishedAt,
          scores: {
            global: lastDoneAudit.globalScore,
            technical: lastDoneAudit.technicalScore,
            content: lastDoneAudit.contentScore,
            architecture: lastDoneAudit.architectureScore,
            conversion: lastDoneAudit.conversionScore,
            geo: lastDoneAudit.geoScore,
          },
          topRisks: lastDoneAudit.findings.map((f) => ({
            id: f.id,
            severity: f.severity as 'critical' | 'high',
            title: f.title,
            pageUrl: f.pageUrl,
            filePath: f.filePath,
            rule: f.rule,
          })),
        }
      : null,
    hasPendingAudit: pendingAudit !== null,
  };
}
