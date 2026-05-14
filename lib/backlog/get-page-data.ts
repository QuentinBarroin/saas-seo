import { db } from '@/lib/db';

export type BacklogItemShape = {
  id: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  category: string;
  status: string;
  acceptanceCriteria: string[];
  claudePrompt: string | null;
  filePathsTargeted: string[];
  testsExpected: string[];
  definitionOfDone: string | null;
  sourceFinding: {
    id: string;
    rule: string;
    title: string;
    severity: string;
  } | null;
};

export type BacklogPageData = {
  project: { id: string; name: string; domain: string };
  items: BacklogItemShape[];
  counts: {
    total: number;
    byPriority: { P0: number; P1: number; P2: number };
    byStatus: {
      todo: number;
      in_progress: number;
      done: number;
      discarded: number;
    };
    byCategory: Record<string, number>;
  };
};

function safeParseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((item) => typeof item === 'string');
  }
  return [];
}

export async function getBacklogPageData(
  projectId: string,
  filters?: { priority?: string; category?: string; status?: string }
): Promise<BacklogPageData | null> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, domain: true },
  });

  if (!project) {
    return null;
  }

  const where = {
    projectId,
    ...(filters?.priority ? { priority: filters.priority } : {}),
    ...(filters?.category ? { category: filters.category } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
  };

  const rawItems = await db.backlogItem.findMany({
    where,
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

  const items: BacklogItemShape[] = rawItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    priority: item.priority as 'P0' | 'P1' | 'P2',
    effort: item.effort as 'XS' | 'S' | 'M' | 'L' | 'XL',
    category: item.category,
    status: item.status,
    acceptanceCriteria: safeParseJsonArray(item.acceptanceCriteria),
    claudePrompt: item.claudePrompt,
    filePathsTargeted: safeParseJsonArray(item.filePathsTargeted),
    testsExpected: safeParseJsonArray(item.testsExpected),
    definitionOfDone: item.definitionOfDone,
    sourceFinding: item.finding
      ? {
          id: item.finding.id,
          rule: item.finding.rule,
          title: item.finding.title,
          severity: item.finding.severity,
        }
      : null,
  }));

  const byPriority = { P0: 0, P1: 0, P2: 0 };
  const byStatus = { todo: 0, in_progress: 0, done: 0, discarded: 0 };
  const byCategory: Record<string, number> = {};

  for (const item of items) {
    byPriority[item.priority]++;
    byStatus[item.status as keyof typeof byStatus]++;
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  }

  return {
    project,
    items,
    counts: {
      total: items.length,
      byPriority,
      byStatus,
      byCategory,
    },
  };
}
