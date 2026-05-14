import { db } from '@/lib/db';

export type SerpOrganicResult = {
  rank: number;
  url: string;
  title?: string;
  snippet?: string;
  domain: string;
};

export type SerpForAudit = {
  keyword: string;
  market: string;
  organic: SerpOrganicResult[];
  paa: string[];
};

export type ReplaceSerpResult = {
  organicCount: number;
  paaCount: number;
};

export async function replaceSerpForAudit(
  projectId: string,
  fetchedAtFloor: Date,
  results: SerpForAudit[]
): Promise<ReplaceSerpResult> {
  return db.$transaction(async (tx) => {
    await tx.serpResult.deleteMany({
      where: {
        projectId,
        fetchedAt: { gte: fetchedAtFloor },
      },
    });

    await tx.serpPAA.deleteMany({
      where: {
        projectId,
        fetchedAt: { gte: fetchedAtFloor },
      },
    });

    let organicCount = 0;
    let paaCount = 0;

    for (const result of results) {
      if (result.organic.length > 0) {
        await tx.serpResult.createMany({
          data: result.organic.map((item) => ({
            projectId,
            keyword: result.keyword,
            market: result.market,
            rank: item.rank,
            url: item.url,
            title: item.title ?? null,
            snippet: item.snippet ?? null,
            domain: item.domain,
            fetchedAt: fetchedAtFloor,
          })),
        });
        organicCount += result.organic.length;
      }

      if (result.paa.length > 0) {
        await tx.serpPAA.createMany({
          data: result.paa.map((question) => ({
            projectId,
            keyword: result.keyword,
            question,
            fetchedAt: fetchedAtFloor,
          })),
        });
        paaCount += result.paa.length;
      }
    }

    return { organicCount, paaCount };
  });
}
