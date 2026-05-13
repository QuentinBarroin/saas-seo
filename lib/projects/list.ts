import { db } from '@/lib/db';

export async function listProjects() {
  return db.seoProject.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      domain: true,
      type: true,
      market: true,
      createdAt: true,
      _count: {
        select: { keywords: true, competitors: true, audits: true },
      },
    },
  });
}
