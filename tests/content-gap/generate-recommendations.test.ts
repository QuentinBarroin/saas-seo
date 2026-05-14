import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { generateContentGapRecommendations } from '@/lib/content-gap/generate-recommendations';

type MockClient = {
  keyword: {
    findMany: ReturnType<typeof vi.fn>;
  };
  seoPage: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe('generateContentGapRecommendations', () => {
  let mockDb: MockClient;

  beforeEach(() => {
    mockDb = {
      keyword: {
        findMany: vi.fn(),
      },
      seoPage: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
  });

  it('retourne tout à 0 si aucun cluster', async () => {
    mockDb.keyword.findMany.mockResolvedValueOnce([]);

    const result = await generateContentGapRecommendations(
      mockDb as unknown as PrismaClient,
      { projectId: 'p1' }
    );

    expect(result).toEqual({
      clustersScanned: 0,
      pagesRecommended: 0,
      pagesMatched: 0,
      clustersWithoutKeyword: 0,
    });
  });

  it('crée 2 pages recommended si 2 clusters sans pages existantes', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Recrutement IT' }, { cluster: 'Formation Tech' }])
      .mockResolvedValueOnce([{ query: 'recruteur it', isMoneyKeyword: false }])
      .mockResolvedValueOnce([{ query: 'formation tech', isMoneyKeyword: false }]);

    mockDb.seoPage.findFirst.mockResolvedValue(null);
    mockDb.seoPage.create.mockResolvedValue({});

    const result = await generateContentGapRecommendations(
      mockDb as unknown as PrismaClient,
      { projectId: 'p1' }
    );

    expect(result).toEqual({
      clustersScanned: 2,
      pagesRecommended: 2,
      pagesMatched: 0,
      clustersWithoutKeyword: 0,
    });

    expect(mockDb.seoPage.create).toHaveBeenCalledTimes(2);
    expect(mockDb.seoPage.create).toHaveBeenNthCalledWith(1, {
      data: {
        projectId: 'p1',
        cluster: 'Recrutement IT',
        targetKeyword: 'recruteur it',
        slug: 'recrutement-it',
        status: 'recommended',
        pageType: null,
      },
    });
    expect(mockDb.seoPage.create).toHaveBeenNthCalledWith(2, {
      data: {
        projectId: 'p1',
        cluster: 'Formation Tech',
        targetKeyword: 'formation tech',
        slug: 'formation-tech',
        status: 'recommended',
        pageType: null,
      },
    });
  });

  it('met à jour slug + targetKeyword si page recommended existante', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Recrutement IT' }])
      .mockResolvedValueOnce([{ query: 'nouveau mot clé', isMoneyKeyword: false }]);

    mockDb.seoPage.findFirst.mockResolvedValueOnce({ id: 'page1', status: 'recommended' });
    mockDb.seoPage.update.mockResolvedValue({});

    const result = await generateContentGapRecommendations(
      mockDb as unknown as PrismaClient,
      { projectId: 'p1' }
    );

    expect(result).toEqual({
      clustersScanned: 1,
      pagesRecommended: 1,
      pagesMatched: 0,
      clustersWithoutKeyword: 0,
    });

    expect(mockDb.seoPage.update).toHaveBeenCalledWith({
      where: { id: 'page1' },
      data: {
        targetKeyword: 'nouveau mot clé',
        slug: 'recrutement-it',
      },
    });
  });

  it('met à jour uniquement targetKeyword si page existing', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Recrutement IT' }])
      .mockResolvedValueOnce([{ query: 'nouveau mot clé', isMoneyKeyword: false }]);

    mockDb.seoPage.findFirst.mockResolvedValueOnce({ id: 'page1', status: 'existing' });
    mockDb.seoPage.update.mockResolvedValue({});

    const result = await generateContentGapRecommendations(
      mockDb as unknown as PrismaClient,
      { projectId: 'p1' }
    );

    expect(result).toEqual({
      clustersScanned: 1,
      pagesRecommended: 0,
      pagesMatched: 1,
      clustersWithoutKeyword: 0,
    });

    expect(mockDb.seoPage.update).toHaveBeenCalledWith({
      where: { id: 'page1' },
      data: {
        targetKeyword: 'nouveau mot clé',
      },
    });
  });

  it('prend le money keyword en priorité', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Recrutement IT' }])
      .mockResolvedValueOnce([
        { query: 'recruteur it', isMoneyKeyword: false },
        { query: 'agence recrutement tech', isMoneyKeyword: true },
      ]);

    mockDb.seoPage.findFirst.mockResolvedValue(null);
    mockDb.seoPage.create.mockResolvedValue({});

    await generateContentGapRecommendations(mockDb as unknown as PrismaClient, { projectId: 'p1' });

    expect(mockDb.seoPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetKeyword: 'recruteur it',
        }),
      })
    );
  });

  it('génère un slug fallback si le nom du cluster est vide après nettoyage', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: '@#$' }])
      .mockResolvedValueOnce([{ query: 'test', isMoneyKeyword: false }]);

    mockDb.seoPage.findFirst.mockResolvedValue(null);
    mockDb.seoPage.create.mockResolvedValue({});

    await generateContentGapRecommendations(mockDb as unknown as PrismaClient, { projectId: 'p1' });

    expect(mockDb.seoPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: expect.stringMatching(/^cluster-[a-z0-9]{7}$/),
        }),
      })
    );
  });

  it('skip les clusters sans keywords (incrémente clustersWithoutKeyword)', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Cluster Vide' }])
      .mockResolvedValueOnce([]);

    const result = await generateContentGapRecommendations(
      mockDb as unknown as PrismaClient,
      { projectId: 'p1' }
    );

    expect(result).toEqual({
      clustersScanned: 1,
      pagesRecommended: 0,
      pagesMatched: 0,
      clustersWithoutKeyword: 1,
    });

    expect(mockDb.seoPage.create).not.toHaveBeenCalled();
  });

  it('normalise correctement les slugs avec accents et espaces', async () => {
    mockDb.keyword.findMany
      .mockResolvedValueOnce([{ cluster: 'Développement Web & Mobile' }])
      .mockResolvedValueOnce([{ query: 'dev web', isMoneyKeyword: false }]);

    mockDb.seoPage.findFirst.mockResolvedValue(null);
    mockDb.seoPage.create.mockResolvedValue({});

    await generateContentGapRecommendations(mockDb as unknown as PrismaClient, { projectId: 'p1' });

    expect(mockDb.seoPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'd-veloppement-web-mobile',
        }),
      })
    );
  });
});
