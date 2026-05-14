import { db } from '@/lib/db';
import type { BacklogResponse } from '@/lib/ai/prompts/generate-backlog';

export type BacklogItemInput = BacklogResponse['items'][number];

export async function replaceBacklogForAudit(
  auditId: string,
  projectId: string,
  items: BacklogItemInput[]
): Promise<{ count: number }> {
  await db.$transaction(async (tx) => {
    await tx.backlogItem.deleteMany({
      where: { projectId, status: 'todo' },
    });

    if (items.length === 0) return;

    await tx.backlogItem.createMany({
      data: items.map((item) => ({
        projectId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        effort: item.effort,
        category: item.category,
        status: 'todo',
        acceptanceCriteria: item.acceptanceCriteria as unknown as object,
        claudePrompt: item.claudePrompt,
        sourceFindingId: item.sourceFindingId,
        filePathsTargeted: item.filePathsTargeted as unknown as object,
        testsExpected: item.testsExpected as unknown as object,
        definitionOfDone: item.definitionOfDone,
      })),
    });

    await tx.seoAudit.update({
      where: { id: auditId },
      data: { backlogJson: items as unknown as object },
    });
  });

  return { count: items.length };
}
