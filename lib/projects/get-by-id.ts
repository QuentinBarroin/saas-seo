import { db } from '@/lib/db';

export type ProjectDetail = {
  id: string;
  name: string;
  domain: string;
  repoUrl: string | null;
  type: string;
  businessGoal: string;
  market: string;
  createdAt: Date;
  updatedAt: Date;
  competitors: Array<{
    id: string;
    domain: string;
    source: string | null;
    serpFrequency: number | null;
  }>;
  seedKeywords: Array<{ id: string; query: string }>;
};

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const project = await db.seoProject.findUnique({
    where: { id },
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

  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    domain: project.domain,
    repoUrl: project.repoUrl,
    type: project.type,
    businessGoal: project.businessGoal,
    market: project.market,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    competitors: project.competitors,
    seedKeywords: project.keywords,
  };
}
