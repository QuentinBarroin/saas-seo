import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPagesList } from '@/lib/pages/get-pages-list';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: { findUnique: vi.fn() },
    seoPage: { findMany: vi.fn() },
  },
}));

type RawPage = {
  id: string;
  status: string;
  cluster?: string | null;
  slug?: string | null;
};

function seoPage(raw: RawPage) {
  return {
    id: raw.id,
    url: null,
    slug: raw.slug ?? null,
    pageType: null,
    targetKeyword: null,
    cluster: raw.cluster ?? null,
    status: raw.status,
    wordCount: null,
    indexable: null,
    technicalScore: null,
    contentScore: null,
  };
}

const PROJECT = { id: 'proj-1', name: 'Shooting Pilot', domain: 'sp.com' };

describe('getPagesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne null si le projet est introuvable', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(null as never);
    expect(await getPagesList('unknown')).toBeNull();
  });

  it('compte les pages par statut sur l’ensemble du projet', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(PROJECT as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([
      seoPage({ id: 'a', status: 'recommended' }),
      seoPage({ id: 'b', status: 'recommended' }),
      seoPage({ id: 'c', status: 'existing' }),
    ] as never);

    const data = await getPagesList('proj-1');

    expect(data?.counts.total).toBe(3);
    expect(data?.counts.byStatus).toEqual({ recommended: 2, existing: 1 });
    expect(data?.pages).toHaveLength(3);
  });

  it('filtre les pages par statut sans changer les compteurs globaux', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(PROJECT as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([
      seoPage({ id: 'a', status: 'recommended' }),
      seoPage({ id: 'b', status: 'existing' }),
      seoPage({ id: 'c', status: 'done' }),
    ] as never);

    const data = await getPagesList('proj-1', { status: 'existing' });

    expect(data?.pages).toHaveLength(1);
    expect(data?.pages[0]?.id).toBe('b');
    expect(data?.counts.total).toBe(3);
    expect(data?.counts.byStatus).toEqual({
      recommended: 1,
      existing: 1,
      done: 1,
    });
  });

  it('trie les pages : recommended → in_progress → existing → done', async () => {
    vi.mocked(db.seoProject.findUnique).mockResolvedValue(PROJECT as never);
    vi.mocked(db.seoPage.findMany).mockResolvedValue([
      seoPage({ id: 'done', status: 'done' }),
      seoPage({ id: 'existing', status: 'existing' }),
      seoPage({ id: 'recommended', status: 'recommended' }),
      seoPage({ id: 'progress', status: 'in_progress' }),
    ] as never);

    const data = await getPagesList('proj-1');

    expect(data?.pages.map((p) => p.id)).toEqual([
      'recommended',
      'progress',
      'existing',
      'done',
    ]);
  });
});
