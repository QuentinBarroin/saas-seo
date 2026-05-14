import { db } from '@/lib/db';

export type UpdateProjectInput = {
  id: string;
  name: string;
  domain: string;
  repoUrl?: string;
  type: string;
  market: string;
  businessGoals: string[];
};

export async function updateProject(input: UpdateProjectInput): Promise<void> {
  await db.seoProject.update({
    where: { id: input.id },
    data: {
      name: input.name,
      domain: input.domain,
      repoUrl: input.repoUrl ?? null,
      type: input.type,
      market: input.market,
      businessGoal: input.businessGoals.join(','),
    },
  });
}
