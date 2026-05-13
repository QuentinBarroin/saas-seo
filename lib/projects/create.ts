import { db } from '@/lib/db';

export type CreateProjectInput = {
  name: string;
  domain: string;
  repoUrl?: string;
  type: string;
  businessGoals: string[];
  market: string;
  competitors: string[];
  seedKeywords: string[];
};

export async function createProject(input: CreateProjectInput) {
  return db.$transaction(async (tx) => {
    const project = await tx.seoProject.create({
      data: {
        name: input.name,
        domain: input.domain,
        repoUrl: input.repoUrl ?? null,
        type: input.type,
        businessGoal: input.businessGoals.join(','),
        market: input.market,
      },
    });

    if (input.competitors.length > 0) {
      await tx.competitor.createMany({
        data: input.competitors.map((domain) => ({
          projectId: project.id,
          domain,
          source: 'manual',
        })),
        skipDuplicates: true,
      });
    }

    if (input.seedKeywords.length > 0) {
      await tx.keyword.createMany({
        data: input.seedKeywords.map((query) => ({
          projectId: project.id,
          query,
          source: 'seed',
        })),
      });
    }

    return project;
  });
}
