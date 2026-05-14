import { db } from '@/lib/db';

export type PageDetail = {
  project: { id: string; name: string; domain: string };
  page: {
    id: string;
    url: string | null;
    slug: string | null;
    pageType: string | null;
    targetKeyword: string | null;
    cluster: string | null;
    status: string;
    title: string | null;
    description: string | null;
    h1: string | null;
    wordCount: number | null;
    indexable: boolean | null;
    canonical: string | null;
    hasJsonLd: boolean | null;
    hasFaq: boolean | null;
    hasCta: boolean | null;
    scores: {
      technical: number | null;
      content: number | null;
      geo: number | null;
      conversion: number | null;
    };
  };
  clusterKeywords: Array<{ query: string; isMoneyKeyword: boolean }>;
};

export async function getPageDetail(pageId: string): Promise<PageDetail | null> {
  const page = await db.seoPage.findUnique({
    where: { id: pageId },
    include: { project: true },
  });

  if (!page || !page.project) {
    return null;
  }

  let clusterKeywords: Array<{ query: string; isMoneyKeyword: boolean }> = [];
  if (page.cluster) {
    clusterKeywords = await db.keyword.findMany({
      where: {
        projectId: page.projectId,
        cluster: page.cluster,
      },
      select: {
        query: true,
        isMoneyKeyword: true,
      },
      orderBy: [{ isMoneyKeyword: 'desc' }, { query: 'asc' }],
    });
  }

  return {
    project: {
      id: page.project.id,
      name: page.project.name,
      domain: page.project.domain,
    },
    page: {
      id: page.id,
      url: page.url,
      slug: page.slug,
      pageType: page.pageType,
      targetKeyword: page.targetKeyword,
      cluster: page.cluster,
      status: page.status,
      title: page.title,
      description: page.description,
      h1: page.h1,
      wordCount: page.wordCount,
      indexable: page.indexable,
      canonical: page.canonical,
      hasJsonLd: page.hasJsonLd,
      hasFaq: page.hasFaq,
      hasCta: page.hasCta,
      scores: {
        technical: page.technicalScore,
        content: page.contentScore,
        geo: page.geoScore,
        conversion: page.conversionScore,
      },
    },
    clusterKeywords,
  };
}
