import { db } from '@/lib/db';

export async function addSeedKeywords(
  projectId: string,
  queries: string[]
): Promise<{ inserted: number; skipped: number }> {
  if (queries.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const existing = await db.keyword.findMany({
    where: {
      projectId,
      query: { in: queries },
    },
    select: { query: true },
  });

  const existingQueries = new Set(existing.map((k) => k.query));
  const newQueries = queries.filter((q) => !existingQueries.has(q));

  if (newQueries.length > 0) {
    await db.keyword.createMany({
      data: newQueries.map((query) => ({
        projectId,
        query,
        source: 'seed',
      })),
    });
  }

  return {
    inserted: newQueries.length,
    skipped: queries.length - newQueries.length,
  };
}

export async function removeSeedKeyword(
  keywordId: string,
  projectId: string
): Promise<void> {
  await db.keyword.deleteMany({
    where: {
      id: keywordId,
      projectId,
      source: 'seed',
    },
  });
}
