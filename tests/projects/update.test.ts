import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProject } from '@/lib/projects/update';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    seoProject: {
      update: vi.fn(),
    },
  },
}));

describe('updateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates project with all fields', async () => {
    vi.mocked(db.seoProject.update).mockResolvedValue({} as never);

    await updateProject({
      id: 'proj-1',
      name: 'Updated Project',
      domain: 'https://updated.com',
      repoUrl: 'https://github.com/org/new-repo',
      type: 'marketplace',
      market: 'US',
      businessGoals: ['demos', 'leads', 'inscriptions'],
    });

    expect(db.seoProject.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: {
        name: 'Updated Project',
        domain: 'https://updated.com',
        repoUrl: 'https://github.com/org/new-repo',
        type: 'marketplace',
        market: 'US',
        businessGoal: 'demos,leads,inscriptions',
      },
    });
  });

  it('updates project with null repoUrl when undefined', async () => {
    vi.mocked(db.seoProject.update).mockResolvedValue({} as never);

    await updateProject({
      id: 'proj-2',
      name: 'No Repo Project',
      domain: 'https://norepo.com',
      type: 'saas',
      market: 'FR',
      businessGoals: ['ventes'],
    });

    expect(db.seoProject.update).toHaveBeenCalledWith({
      where: { id: 'proj-2' },
      data: {
        name: 'No Repo Project',
        domain: 'https://norepo.com',
        repoUrl: null,
        type: 'saas',
        market: 'FR',
        businessGoal: 'ventes',
      },
    });
  });

  it('joins business goals with comma', async () => {
    vi.mocked(db.seoProject.update).mockResolvedValue({} as never);

    await updateProject({
      id: 'proj-3',
      name: 'Multi Goal',
      domain: 'https://multigoal.com',
      type: 'lead_gen',
      market: 'FR',
      businessGoals: ['demos', 'leads', 'ventes', 'visibilite'],
    });

    expect(db.seoProject.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessGoal: 'demos,leads,ventes,visibilite',
        }),
      })
    );
  });
});
